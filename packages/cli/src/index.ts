#!/usr/bin/env node
import { Command } from 'commander';
import { CORE_VERSION, OllamaService, PromptEngine, ContextBuilder, storage, historyManager, templateManager, codeGenerator, StorageProvider } from '@xmlpg/core';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import boxen from 'boxen';
import fs from 'fs';
import path from 'path';
import os from 'os';

const program = new Command();
const ollama = new OllamaService();
const promptEngine = new PromptEngine();
const contextBuilder = new ContextBuilder();

// Define Node Storage Provider
class NodeStorageProvider implements StorageProvider {
  private baseDir: string;

  constructor(appName: string = 'xml-prompter') {
    this.baseDir = path.join(os.homedir(), `.${appName}`);
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  private getFilePath(key: string): string {
    return path.join(this.baseDir, `${key}.json`);
  }

  save<T>(key: string, data: T): void {
    try {
      fs.writeFileSync(this.getFilePath(key), JSON.stringify(data, null, 2));
    } catch (error) {
      console.error(`Failed to save ${key}:`, error);
    }
  }

  load<T>(key: string, defaultValue: T): T {
    try {
      const filePath = this.getFilePath(key);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(content) as T;
      }
    } catch (error) {
      console.error(`Failed to load ${key}:`, error);
    }
    return defaultValue;
  }

  clear(key: string): void {
    try {
      const filePath = this.getFilePath(key);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error(`Failed to clear ${key}:`, error);
    }
  }
}

// Initialize Storage with Node Provider
storage.setProvider(new NodeStorageProvider());

program
  .name('xmlpg')
  .description('XML Website Prompt Generator CLI')
  .version(CORE_VERSION);

// --- Interactive Mode ---
program.command('interactive')
  .alias('i')
  .description('Start interactive mode')
  .action(async () => {
    console.log(boxen(chalk.blue('XML Website Prompt Generator'), { padding: 1, borderStyle: 'round' }));
    
    // Check connection
    const spinner = ora('Checking Ollama connection...').start();
    const isConnected = await ollama.checkHealth();
    if (isConnected) {
      spinner.succeed(chalk.green('Ollama Connected'));
    } else {
      spinner.fail(chalk.red('Ollama Disconnected'));
      console.log(chalk.yellow('Please start Ollama (localhost:11434)'));
      return;
    }

    // Main Loop
    while (true) {
      const { action } = await inquirer.prompt([{
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          'Generate Prompt',
          'Enhance Prompt',
          'List Models',
          'View History',
          'Exit'
        ]
      }]);

      if (action === 'Exit') {
        console.log(chalk.blue('Goodbye!'));
        process.exit(0);
      }

      if (action === 'List Models') {
        const models = await ollama.listModels();
        console.table(models.map(m => ({ Name: m.name, Size: (m.size / 1e9).toFixed(2) + ' GB' })));
      }

      if (action === 'View History') {
        const history = historyManager.getHistory();
        if (history.length === 0) {
          console.log(chalk.yellow('No history found.'));
        } else {
           history.slice(0, 5).forEach(h => {
             console.log(chalk.gray(`[${new Date(h.timestamp).toLocaleTimeString()}]`) + ` ${h.prompt.substring(0, 50)}...`);
           });
        }
      }

      if (action === 'Generate Prompt') {
        const { model } = await inquirer.prompt([{
          type: 'list',
          name: 'model',
          message: 'Select Model:',
          choices: (await ollama.listModels()).map(m => m.name)
        }]);

        const { prompt } = await inquirer.prompt([{
          type: 'input',
          name: 'prompt',
          message: 'Describe your website:'
        }]);

        const genSpinner = ora('Generating XML...').start();
        try {
          // Use Prompt Engine
          const system = promptEngine.buildSystemPrompt('Standard Architect');
          let output = '';
          
          await ollama.generate({
            model,
            prompt: `Generate XML for: ${prompt} \n System: ${system}`,
            stream: true
          }, (chunk) => {
            output += chunk;
          });
          
          genSpinner.succeed('Generation Complete');
          console.log(boxen(output, { padding: 1, borderColor: 'green' }));
          
          // Save to history
          historyManager.addEntry({
            prompt,
            response: output,
            model
          });
        } catch (e: any) {
          genSpinner.fail('Generation Failed');
          console.error(e.message);
        }
      }
      
      if (action === 'Enhance Prompt') {
        const { model } = await inquirer.prompt([{
          type: 'list',
          name: 'model',
          message: 'Select Model for Enhancement:',
          choices: (await ollama.listModels()).map(m => m.name)
        }]);
        
        const { rawPrompt } = await inquirer.prompt([{
          type: 'input',
          name: 'rawPrompt',
          message: 'Enter rough idea:'
        }]);
        
        const enhanceSpinner = ora('Enhancing...').start();
        try {
           const enhanced = await promptEngine.enhance(rawPrompt, model);
           enhanceSpinner.succeed('Enhanced Prompt:');
           console.log(chalk.cyan(enhanced));
        } catch (e: any) {
           enhanceSpinner.fail('Failed');
           console.error(e.message);
        }
      }
    }
  });

program.command('info')
  .description('Show environment info')
  .action(() => {
    console.log(chalk.blue('XML Website Prompt Generator'));
    console.log(`Core Version: ${CORE_VERSION}`);
  });

const models = program.command('models')
  .description('Manage AI models');

models.command('list')
  .description('List available models')
  .action(async () => {
    console.log('Fetching models...');
    const list = await ollama.listModels();
    if (list.length === 0) {
      console.log(chalk.yellow('No models found.'));
      return;
    }
    console.table(list.map(m => ({
      Name: m.name,
      Size: (m.size / 1024 / 1024 / 1024).toFixed(2) + ' GB',
      Modified: m.modified_at
    })));
  });

const templates = program.command('templates').description('Manage templates');

templates.command('list')
  .action(() => {
    const list = templateManager.getTemplates();
    if (list.length === 0) {
       console.log(chalk.yellow('No templates found.'));
       return;
    }
    console.table(list.map(t => ({ Name: t.name, Category: t.category })));
  });

program.command('generate')
  .description('Generate an XML prompt')
  .argument('<prompt>', 'Natural language description')
  .option('-m, --model <model>', 'Model to use', 'mistral')
  .action(async (prompt, options) => {
    console.log(chalk.green(`Generating prompt using ${options.model}...`));
    console.log(chalk.gray(`Input: ${prompt}`));
    
    try {
        const response = await ollama.generate({
            model: options.model,
            prompt: prompt,
            stream: false
        });
        console.log(chalk.bold('\nResult:\n'));
        console.log(response.response);
    } catch (e: any) {
        console.error(chalk.red('Error generating prompt:'), e.message);
        console.log(chalk.yellow('Make sure Ollama is running (localhost:11434) and the model is pulled.'));
    }
  });

program.command('build')
  .description('Compile XML file to Web App')
  .argument('<xmlFile>', 'Path to XML file')
  .option('-m, --model <model>', 'Model to use', 'mistral')
  .option('-o, --output <output>', 'Output HTML file path', 'app.html')
  .action(async (xmlFile, options) => {
    const spinner = ora('Reading XML...').start();
    try {
      const xmlContent = fs.readFileSync(path.resolve(xmlFile), 'utf-8');
      spinner.text = 'Generating Web App... (This may take a moment)';
      
      const code = await codeGenerator.generateWebApp(xmlContent, options.model, () => {});
      
      fs.writeFileSync(path.resolve(options.output), code);
      spinner.succeed(`Web App generated at: ${options.output}`);
    } catch (e: any) {
      spinner.fail('Build failed');
      console.error(e.message);
    }
  });

program.parse();
