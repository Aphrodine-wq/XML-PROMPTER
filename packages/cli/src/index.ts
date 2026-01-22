#!/usr/bin/env node
import { Command } from 'commander';
import { CORE_VERSION, OllamaService } from '@xmlpg/core';
import chalk from 'chalk';

const program = new Command();
const ollama = new OllamaService();

program
  .name('xmlpg')
  .description('XML Website Prompt Generator CLI')
  .version(CORE_VERSION);

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

program.parse();
