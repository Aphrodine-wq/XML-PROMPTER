import { IPlugin } from '../plugin-system.js';
import { aiManager } from '../ai-manager.js';

export class PythonGeneratorPlugin implements IPlugin {
  id = 'python-generator';
  name = 'Python Code Generator';
  version = '1.0.0';
  description = 'Generates Python scripts from XML blueprints';

  async onInit() {
    console.log('Python Generator Plugin Initialized');
  }

  generators = {
    'python': async (input: any) => {
        const prompt = `Convert this XML blueprint to a Python script:\n${input.xml}`;
        const response = await aiManager.generate({
            model: 'gemini-2.0-flash',
            prompt,
            stream: false
        });
        return response.response;
    }
  };
}
