import * as vscode from 'vscode';
import { aiManager } from '@xmlpg/core';

export function activate(context: vscode.ExtensionContext) {
	console.log('XML Gen Extension is now active!');

	let disposable = vscode.commands.registerCommand('xml-gen.start', async () => {
		vscode.window.showInformationMessage('XML Gen Started!');
        
        // This is a placeholder. 
        // In a real implementation, we would open a WebviewPanel
        // reusing the same React UI from the 'renderer' package.
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {}
