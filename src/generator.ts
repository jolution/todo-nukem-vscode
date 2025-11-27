import * as vscode from 'vscode';
import { PriorityEmoji, TypeEmoji, ContextEmoji, MetaEmoji } from './shared/emoji';

enum MetaBlockKey {
    TBD = 'TBD',
    Scope = 'Scope',
    Ticket = 'Ticket',
    Until = 'Until',
    Assignee = 'Assignee',
    SelfAssignee = 'SelfAssignee',
    Author = 'Author',
    SelfAuthor = 'SelfAuthor',
    Version = 'Version',
    Docs = 'Docs',
    BlockCommit = 'Block-Commit'
}

interface MetaBlock extends vscode.QuickPickItem {
    symbol: string;
    key: MetaBlockKey;
}

/**
 * Returns the appropriate comment prefix for the given language
 */
function getCommentPrefix(languageId: string): string {
    const commentMap: { [key: string]: string } = {
        'javascript': '//',
        'typescript': '//',
        'java': '//',
        'c': '//',
        'cpp': '//',
        'csharp': '//',
        'go': '//',
        'rust': '//',
        'php': '//',
        'swift': '//',
        'kotlin': '//',
        'dart': '//',
        'python': '#',
        'ruby': '#',
        'shell': '#',
        'bash': '#',
        'powershell': '#',
        'yaml': '#',
        'perl': '#',
        'r': '#',
        'html': '<!--',
        'xml': '<!--',
        'css': '/*',
        'scss': '//',
        'less': '//',
        'sql': '--',
        'lua': '--',
        'haskell': '--',
    };
    return commentMap[languageId] || '//';
}

/**
 * Retrieves the Git username from the current workspace
 */
function getGitUserName(): string {
    try {
        const { execSync } = require('child_process');
        return execSync('git config user.name', { 
            cwd: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath,
            encoding: 'utf8'
        }).trim();
    } catch {
        return '';
    }
}

export function activate(context: vscode.ExtensionContext) {
    // IMPORTANT: Command name must match package.json!
    const disposable = vscode.commands.registerCommand('todoNukem.insertTodo', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        const commentPrefix = getCommentPrefix(editor.document.languageId);

        // Priority selection
        const prio = await vscode.window.showQuickPick(
            [
                { label: `${PriorityEmoji.Low} ${vscode.l10n.t('lowPrio')}`, symbol: PriorityEmoji.Low },
                { label: `${PriorityEmoji.Medium} ${vscode.l10n.t('mediumPrio')}`, symbol: PriorityEmoji.Medium },
                { label: `${PriorityEmoji.High} ${vscode.l10n.t('highPrio')}`, symbol: PriorityEmoji.High }
            ],
            { placeHolder: vscode.l10n.t('selectPriority') }
        );
        if (!prio) return;

        // Type selection
        const type = await vscode.window.showQuickPick(
            [
                { label: `${TypeEmoji.Feature} ${vscode.l10n.t('feature')}`, symbol: TypeEmoji.Feature },
                { label: `${TypeEmoji.Fix} ${vscode.l10n.t('fix')}`, symbol: TypeEmoji.Fix }
            ],
            { placeHolder: vscode.l10n.t('selectType') }
        );
        if (!type) return;

        // Context selection
        const contextPick = await vscode.window.showQuickPick(
            [
                { label: `${ContextEmoji.Design} ${vscode.l10n.t('design')}`, symbol: ContextEmoji.Design },
                { label: `${ContextEmoji.Doc} ${vscode.l10n.t('doc')}`, symbol: ContextEmoji.Doc },
                { label: `${ContextEmoji.Test} ${vscode.l10n.t('test')}`, symbol: ContextEmoji.Test },
                { label: `${ContextEmoji.Perf} ${vscode.l10n.t('perf')}`, symbol: ContextEmoji.Perf },
                { label: `${ContextEmoji.Lang} ${vscode.l10n.t('lang')}`, symbol: ContextEmoji.Lang },
                { label: `${ContextEmoji.Sec} ${vscode.l10n.t('sec')}`, symbol: ContextEmoji.Sec },
                { label: `${ContextEmoji.Update} ${vscode.l10n.t('update')}`, symbol: ContextEmoji.Update },
                { label: `${ContextEmoji.Optimize} ${vscode.l10n.t('optimize')}`, symbol: ContextEmoji.Optimize },
                { label: `${ContextEmoji.Review} ${vscode.l10n.t('review')}`, symbol: ContextEmoji.Review }
            ],
            { placeHolder: vscode.l10n.t('selectContext') }
        );
        if (!contextPick) return;

        // Message input
        const message = await vscode.window.showInputBox({
            placeHolder: vscode.l10n.t('enterTodoMessage'),
            prompt: vscode.l10n.t('whatNeedsToBeDone')
        });
        if (message === undefined) return;

        // Optional Meta Blocks (multi-select)
        const metaBlocks = await vscode.window.showQuickPick<MetaBlock>(
            [
                { label: `${MetaEmoji.TBD} ${vscode.l10n.t('tbd')}`, symbol: MetaEmoji.TBD, key: MetaBlockKey.TBD },
                { label: `${MetaEmoji.Scope} ${vscode.l10n.t('scope')}`, symbol: MetaEmoji.Scope, key: MetaBlockKey.Scope },
                { label: `${MetaEmoji.Ticket} ${vscode.l10n.t('ticket')}`, symbol: MetaEmoji.Ticket, key: MetaBlockKey.Ticket },
                { label: `${MetaEmoji.Until} ${vscode.l10n.t('until')}`, symbol: MetaEmoji.Until, key: MetaBlockKey.Until },
                { label: `${MetaEmoji.Assignee} ${vscode.l10n.t('assignee')}`, symbol: MetaEmoji.Assignee, key: MetaBlockKey.Assignee },
                { label: `${MetaEmoji.Assignee} ${vscode.l10n.t('selfAssignee')}`, symbol: MetaEmoji.Assignee, key: MetaBlockKey.SelfAssignee },
                { label: `${MetaEmoji.Author} ${vscode.l10n.t('author')}`, symbol: MetaEmoji.Author, key: MetaBlockKey.Author },
                { label: `${MetaEmoji.Author} ${vscode.l10n.t('selfAuthor')}`, symbol: MetaEmoji.Author, key: MetaBlockKey.SelfAuthor },
                { label: `${MetaEmoji.Version} ${vscode.l10n.t('version')}`, symbol: MetaEmoji.Version, key: MetaBlockKey.Version },
                { label: `${MetaEmoji.Docs} ${vscode.l10n.t('docs')}`, symbol: MetaEmoji.Docs, key: MetaBlockKey.Docs },
                { label: `${MetaEmoji.BlockCommit} ${vscode.l10n.t('blockCommit')}`, symbol: MetaEmoji.BlockCommit, key: MetaBlockKey.BlockCommit }
            ],
            { placeHolder: vscode.l10n.t('optionalMetaBlocks'), canPickMany: true }
        );

        let metaLines = '';
        
        if (metaBlocks && metaBlocks.length > 0) {
            const metaValues: string[] = [];
            
            for (const block of metaBlocks) {
                // Blocks without values
                if (block.key === MetaBlockKey.TBD || block.key === MetaBlockKey.BlockCommit) {
                    metaValues.push(`[${block.symbol} ${block.key}]`);
                    continue;
                }

                // Auto-fill with Git username
                if (block.key === MetaBlockKey.SelfAssignee || block.key === MetaBlockKey.SelfAuthor) {
                    const gitUser = getGitUserName();
                    metaValues.push(`[${block.symbol} ${gitUser || vscode.l10n.t('unknown')}]`);
                    continue;
                }

                // User input required
                const value = await vscode.window.showInputBox({
                    placeHolder: vscode.l10n.t('enterValueFor', block.label),
                    prompt: vscode.l10n.t('valueLabel', block.key)
                });
                
                metaValues.push(`[${block.symbol} ${value || block.key}]`);
            }
            
            if (metaValues.length > 0) {
                metaLines = ' ' + metaValues.join(' ');
            }
        }

        // Insert TODO comment
        editor.edit(editBuilder => {
            editor.selections.forEach(sel => {
                editBuilder.replace(sel, `${commentPrefix} TODO: ${prio.symbol} ${type.symbol} ${contextPick.symbol} ${message}${metaLines}`);
            });
        });
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}
