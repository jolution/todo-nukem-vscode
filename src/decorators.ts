import * as vscode from 'vscode';
import { Priority, Type, Context, Meta } from './shared/constants';
import { formatDisplay, clearConfigCache, getTicketBaseUrl } from './shared/config';

let decorationTypes: Map<string, vscode.TextEditorDecorationType> = new Map();
let decorationsEnabled = true;

// Style-Definition for all Emoji-Decorations
const emojiDecorationStyle = {
    letterSpacing: '-999em', // Collapse the space completely
    opacity: '0'
};

/**
 * Document Link Provider for ticket links
 */
class TicketLinkProvider implements vscode.DocumentLinkProvider {
    provideDocumentLinks(document: vscode.TextDocument): vscode.DocumentLink[] {
        const ticketBaseUrl = getTicketBaseUrl();
        
        if (!ticketBaseUrl) {
            return [];
        }

        const links: vscode.DocumentLink[] = [];
        const text = document.getText();
        const ticketRegex = /\[ticket:\s*([A-Z]+-\d+)\]/gi;
        let match;

        while ((match = ticketRegex.exec(text)) !== null) {
            const ticketId = match[1];
            const startPos = document.positionAt(match.index);
            const endPos = document.positionAt(match.index + match[0].length);
            const range = new vscode.Range(startPos, endPos);
            
            const ticketUrl = vscode.Uri.parse(`${ticketBaseUrl}/${ticketId}`);
            const link = new vscode.DocumentLink(range, ticketUrl);
            link.tooltip = `Open ${ticketId} in browser`;
            links.push(link);
        }
        return links;
    }
}

export function activate(context: vscode.ExtensionContext) {
    // Register ticket link provider for all languages
    const linkProvider = vscode.languages.registerDocumentLinkProvider(
        { pattern: '**/*' },
        new TicketLinkProvider()
    );
    context.subscriptions.push(linkProvider);

    // Create decoration types for all keys
    createDecorationTypes();

    // Set initial context
    vscode.commands.executeCommand('setContext', 'todoNukem.decorationsEnabled', decorationsEnabled);

    // Apply decorations on editor change
    let activeEditor = vscode.window.activeTextEditor;
    if (activeEditor) {
        updateDecorations(activeEditor);
    }

    // Command to toggle decorations
    const toggleCommand = vscode.commands.registerCommand('todoNukem.toggleDecorations', () => {
        decorationsEnabled = !decorationsEnabled;
        if (activeEditor) {
            if (decorationsEnabled) {
                updateDecorations(activeEditor);
            } else {
                clearDecorations(activeEditor);
            }
        }
        
        // Update context for icon change
        vscode.commands.executeCommand('setContext', 'todoNukem.decorationsEnabled', decorationsEnabled);
        
        vscode.window.showInformationMessage(
            `TODO NUKEM Decorations: ${decorationsEnabled ? 'Enabled' : 'Disabled'}`
        );
    });

    // Command to refresh config
    const refreshConfigCommand = vscode.commands.registerCommand('todoNukem.refreshConfig', () => {
        clearConfigCache();
        recreateDecorations(activeEditor);
        vscode.window.showInformationMessage('TODO NUKEM: Config reloaded');
    });

    context.subscriptions.push(toggleCommand, refreshConfigCommand);

    // Listen to editor changes
    vscode.window.onDidChangeActiveTextEditor(editor => {
        activeEditor = editor;
        if (editor && decorationsEnabled) {
            updateDecorations(editor);
        }
    }, null, context.subscriptions);

    vscode.workspace.onDidChangeTextDocument(event => {
        if (activeEditor && event.document === activeEditor.document && decorationsEnabled) {
            updateDecorations(activeEditor);
        }
    }, null, context.subscriptions);
}

function recreateDecorations(activeEditor: vscode.TextEditor | undefined) {
    // Dispose old decorations
    decorationTypes.forEach(decoration => decoration.dispose());
    decorationTypes.clear();
    
    // Create new decorations with updated config
    createDecorationTypes();
    
    // Reapply decorations
    if (activeEditor && decorationsEnabled) {
        updateDecorations(activeEditor);
    }
}

function createDecorationTypes() {
    // Priority decorations - include brackets in the key
    Object.values(Priority).forEach(priority => {
        const displayText = formatDisplay('priority', priority.name.toLowerCase());
        decorationTypes.set(priority.key, vscode.window.createTextEditorDecorationType({
            before: {
                contentText: displayText,
            },
            ...emojiDecorationStyle
        }));
    });

    // Type decorations
    Object.values(Type).forEach(type => {
        const displayText = formatDisplay('type', type.name.toLowerCase());
        decorationTypes.set(type.key, vscode.window.createTextEditorDecorationType({
            before: {
                contentText: displayText,
            },
            ...emojiDecorationStyle
        }));
    });

    // Context decorations
    Object.values(Context).forEach(ctx => {
        const displayText = formatDisplay('context', ctx.name.toLowerCase());
        decorationTypes.set(ctx.key, vscode.window.createTextEditorDecorationType({
            before: {
                contentText: displayText,
            },
            ...emojiDecorationStyle
        }));
    });

    // Meta decorations (for "author:", "ticket:", etc. - only replace the name, keep brackets)
    Object.values(Meta).forEach(meta => {
        const metaName = meta.key.replace(/[\[\]]/g, ''); // Remove brackets from key
        
        // Special handling for tbd and block-commit: replace entire [key] with [emoji]
        if (metaName === 'tbd' || metaName === 'block-commit') {
            const displayText = '[' + formatDisplay('meta', metaName.toLowerCase()) + ']';
            decorationTypes.set(meta.key, vscode.window.createTextEditorDecorationType({
                before: {
                    contentText: displayText,
                },
                ...emojiDecorationStyle
            }));
        } else {
            // For other meta tags, only replace the key part (e.g., "author:" → emoji)
            const displayText = formatDisplay('meta', metaName.toLowerCase());
            decorationTypes.set(metaName + ':', vscode.window.createTextEditorDecorationType({
                before: {
                    contentText: displayText,
                },
                ...emojiDecorationStyle
            }));
        }
    });
}

function updateDecorations(editor: vscode.TextEditor) {
    const text = editor.document.getText();
    const decorationsMap: Map<string, vscode.DecorationOptions[]> = new Map();

    // Initialize decoration arrays
    decorationTypes.forEach((_, key) => {
        decorationsMap.set(key, []);
    });

    // Find all TODO lines
    const todoRegex = /TODO:?\s+(.+)/gi;
    let match;

    while ((match = todoRegex.exec(text)) !== null) {
        const lineContent = match[1];
        const startPos = match.index + match[0].indexOf(match[1]);

        // Check for all keys in the line
        decorationTypes.forEach((decorationType, key) => {
            // Escape special regex characters in the key
            const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const keyRegex = new RegExp(escapedKey, 'g');
            let keyMatch;

            while ((keyMatch = keyRegex.exec(lineContent)) !== null) {
                const keyStartPos = startPos + keyMatch.index;
                const keyEndPos = keyStartPos + key.length;

                const startPosition = editor.document.positionAt(keyStartPos);
                const endPosition = editor.document.positionAt(keyEndPos);

                const decoration: vscode.DecorationOptions = {
                    range: new vscode.Range(startPosition, endPosition)
                };

                decorationsMap.get(key)?.push(decoration);
            }
        });
    }

    // Apply all decorations
    decorationsMap.forEach((decorations, key) => {
        const decorationType = decorationTypes.get(key);
        if (decorationType) {
            editor.setDecorations(decorationType, decorations);
        }
    });
}

function clearDecorations(editor: vscode.TextEditor) {
    decorationTypes.forEach(decorationType => {
        editor.setDecorations(decorationType, []);
    });
}

export function deactivate() {
    decorationTypes.forEach(decoration => decoration.dispose());
    decorationTypes.clear();
}
