import * as vscode from 'vscode';

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
    const disposable = vscode.commands.registerCommand('todo-nukem-inserter.insertTodo', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        const commentPrefix = getCommentPrefix(editor.document.languageId);

        // Prio
        const prio = await vscode.window.showQuickPick(
            [
                { label: `🟩 ${vscode.l10n.t('lowPrio')}`, symbol: '🟩' },
                { label: `🔶 ${vscode.l10n.t('mediumPrio')}`, symbol: '🔶' },
                { label: `🔴 ${vscode.l10n.t('highPrio')}`, symbol: '🔴' }
            ],
            { placeHolder: vscode.l10n.t('selectPriority') }
        );
        if (!prio) return;

        // Typ
        const type = await vscode.window.showQuickPick(
            [
                { label: `✨ ${vscode.l10n.t('feature')}`, symbol: '✨' },
                { label: `🐛 ${vscode.l10n.t('fix')}`, symbol: '🐛' }
            ],
            { placeHolder: vscode.l10n.t('selectType') }
        );
        if (!type) return;

        // Context
        const contextPick = await vscode.window.showQuickPick(
            [
                { label: `🎨 ${vscode.l10n.t('design')}`, symbol: '🎨' },
                { label: `📚 ${vscode.l10n.t('doc')}`, symbol: '📚' },
                { label: `🧪 ${vscode.l10n.t('test')}`, symbol: '🧪' },
                { label: `⚡ ${vscode.l10n.t('perf')}`, symbol: '⚡' },
                { label: `🈷️ ${vscode.l10n.t('lang')}`, symbol: '🈷️' },
                { label: `🔒 ${vscode.l10n.t('sec')}`, symbol: '🔒' },
                { label: `🔄 ${vscode.l10n.t('update')}`, symbol: '🔄' },
                { label: `🛠️ ${vscode.l10n.t('optimize')}`, symbol: '🛠️' },
                { label: `👀 ${vscode.l10n.t('review')}`, symbol: '👀' }
            ],
            { placeHolder: vscode.l10n.t('selectContext') }
        );
        if (!contextPick) return;

        // Nachricht eingeben
        const message = await vscode.window.showInputBox({
            placeHolder: vscode.l10n.t('enterTodoMessage'),
            prompt: vscode.l10n.t('whatNeedsToBeDone')
        });
        if (message === undefined) return;

        // Optional Meta Blocks (mehrfach wählbar)
        const metaBlocks = await vscode.window.showQuickPick<MetaBlock>(
            [
                { label: `💬 ${vscode.l10n.t('tbd')}`, symbol: '💬', key: MetaBlockKey.TBD },
                { label: `🎯 ${vscode.l10n.t('scope')}`, symbol: '🎯', key: MetaBlockKey.Scope },
                { label: `🎫 ${vscode.l10n.t('ticket')}`, symbol: '🎫', key: MetaBlockKey.Ticket },
                { label: `📅 ${vscode.l10n.t('until')}`, symbol: '📅', key: MetaBlockKey.Until },
                { label: `👤 ${vscode.l10n.t('assignee')}`, symbol: '👤', key: MetaBlockKey.Assignee },
                { label: `👤 ${vscode.l10n.t('selfAssignee')}`, symbol: '👤', key: MetaBlockKey.SelfAssignee },
                { label: `✍️ ${vscode.l10n.t('author')}`, symbol: '✍️', key: MetaBlockKey.Author },
                { label: `✍️ ${vscode.l10n.t('selfAuthor')}`, symbol: '✍️', key: MetaBlockKey.SelfAuthor },
                { label: `🔖 ${vscode.l10n.t('version')}`, symbol: '🔖', key: MetaBlockKey.Version },
                { label: `📚 ${vscode.l10n.t('docs')}`, symbol: '📚', key: MetaBlockKey.Docs },
                { label: `🛑 ${vscode.l10n.t('blockCommit')}`, symbol: '🛑', key: MetaBlockKey.BlockCommit }
            ],
            { placeHolder: vscode.l10n.t('optionalMetaBlocks'), canPickMany: true }
        );

        let metaLines = '';
        
        if (metaBlocks && metaBlocks.length > 0) {
            const metaValues: string[] = [];
            
            for (const block of metaBlocks) {
                
                if (block.key === MetaBlockKey.TBD || block.key === MetaBlockKey.BlockCommit) {
                    metaValues.push(`[${block.symbol} ${block.key}]`);
                    continue;
                }

                if (block.key === MetaBlockKey.SelfAssignee || block.key === MetaBlockKey.SelfAuthor) {
                    const gitUser = getGitUserName();
                    metaValues.push(`[${block.symbol} ${gitUser || vscode.l10n.t('unknown')}]`);
                    continue;
                }

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

        // Einfügen
        editor.edit(editBuilder => {
            editor.selections.forEach(sel => {
                editBuilder.replace(sel, `${commentPrefix} TODO: ${prio.symbol} ${type.symbol} ${contextPick.symbol} ${message}${metaLines}`);
            });
        });
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}
