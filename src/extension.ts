/**
 * TODO NUKEM Extension Entry Point
 * Coordinates Generator and Viewer Modules
 */
import * as vscode from 'vscode';
import * as generator from './generator';
import * as viewer from './viewer';
import * as decorators from './decorators';

export function activate(context: vscode.ExtensionContext) {
    try {
        // Activate Generator module (command for TODO creation)
        generator.activate(context);
        
        // Activate Viewer module (TreeView with filters)
        viewer.activate(context);
        
        // Activate Decorators module (visual emoji display for keys)
        decorators.activate(context);
    } catch (error) {
        vscode.window.showErrorMessage(`TODO NUKEM activation failed: ${error}`);
    }
}

export function deactivate() {
    try {
        generator.deactivate();
        viewer.deactivate();
        decorators.deactivate();
    } catch (error) {
        // Silent error handling
    }
}