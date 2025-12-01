import * as vscode from 'vscode';
import { Priority, Type, Context, Meta } from './shared/constants';
import { getCommentPrefix, MetaBlockKey, MetaBlock, getGitUserName } from './shared/utils';

export function activate(context: vscode.ExtensionContext) {
    // IMPORTANT: Command name must match package.json!
    const disposable = vscode.commands.registerCommand('todoNukem.insertTodo', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        const commentPrefix = getCommentPrefix(editor.document.languageId);

        // Priority selection
        const prio = await vscode.window.showQuickPick(
            [
                { label: `${Priority.Low.emoji} ${vscode.l10n.t('lowPrio')}`, key: Priority.Low.key },
                { label: `${Priority.Medium.emoji} ${vscode.l10n.t('mediumPrio')}`, key: Priority.Medium.key },
                { label: `${Priority.High.emoji} ${vscode.l10n.t('highPrio')}`, key: Priority.High.key }
            ],
            { placeHolder: vscode.l10n.t('selectPriority') }
        );
        if (!prio) return;

        // Type selection
        const type = await vscode.window.showQuickPick(
            [
                { label: `${Type.Feature.emoji} ${vscode.l10n.t('feature')}`, key: Type.Feature.key },
                { label: `${Type.Fix.emoji} ${vscode.l10n.t('fix')}`, key: Type.Fix.key }
            ],
            { placeHolder: vscode.l10n.t('selectType') }
        );
        if (!type) return;

        // Context selection
        const contextPick = await vscode.window.showQuickPick(
            [
                { label: `${Context.Design.emoji} ${vscode.l10n.t('design')}`, key: Context.Design.key },
                { label: `${Context.Doc.emoji} ${vscode.l10n.t('doc')}`, key: Context.Doc.key },
                { label: `${Context.Test.emoji} ${vscode.l10n.t('test')}`, key: Context.Test.key },
                { label: `${Context.Perf.emoji} ${vscode.l10n.t('perf')}`, key: Context.Perf.key },
                { label: `${Context.Lang.emoji} ${vscode.l10n.t('lang')}`, key: Context.Lang.key },
                { label: `${Context.Sec.emoji} ${vscode.l10n.t('sec')}`, key: Context.Sec.key },
                { label: `${Context.Update.emoji} ${vscode.l10n.t('update')}`, key: Context.Update.key },
                { label: `${Context.Optimize.emoji} ${vscode.l10n.t('optimize')}`, key: Context.Optimize.key },
                { label: `${Context.Review.emoji} ${vscode.l10n.t('review')}`, key: Context.Review.key }
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
                { label: `${Meta.TBD.emoji} ${vscode.l10n.t('tbd')}`, key: Meta.TBD.key, metaType: MetaBlockKey.TBD },
                { label: `${Meta.Scope.emoji} ${vscode.l10n.t('scope')}`, key: Meta.Scope.key, metaType: MetaBlockKey.Scope },
                { label: `${Meta.Ticket.emoji} ${vscode.l10n.t('ticket')}`, key: Meta.Ticket.key, metaType: MetaBlockKey.Ticket },
                { label: `${Meta.Until.emoji} ${vscode.l10n.t('until')}`, key: Meta.Until.key, metaType: MetaBlockKey.Until },
                { label: `${Meta.Assignee.emoji} ${vscode.l10n.t('assignee')}`, key: Meta.Assignee.key, metaType: MetaBlockKey.Assignee },
                { label: `${Meta.Assignee.emoji} ${vscode.l10n.t('selfAssignee')}`, key: Meta.Assignee.key, metaType: MetaBlockKey.SelfAssignee },
                { label: `${Meta.Author.emoji} ${vscode.l10n.t('author')}`, key: Meta.Author.key, metaType: MetaBlockKey.Author },
                { label: `${Meta.Author.emoji} ${vscode.l10n.t('selfAuthor')}`, key: Meta.Author.key, metaType: MetaBlockKey.SelfAuthor, picked: true },
                { label: `${Meta.Version.emoji} ${vscode.l10n.t('version')}`, key: Meta.Version.key, metaType: MetaBlockKey.Version },
                { label: `${Meta.Docs.emoji} ${vscode.l10n.t('docs')}`, key: Meta.Docs.key, metaType: MetaBlockKey.Docs },
                { label: `${Meta.BlockCommit.emoji} ${vscode.l10n.t('blockCommit')}`, key: Meta.BlockCommit.key, metaType: MetaBlockKey.BlockCommit }
            ],
            { placeHolder: vscode.l10n.t('optionalMetaBlocks'), canPickMany: true }
        );

        let metaLines = '';
        
        if (metaBlocks && metaBlocks.length > 0) {
            const metaValues: string[] = [];
            
            for (const block of metaBlocks) {
                // Blocks without values
                if (block.metaType === MetaBlockKey.TBD || block.metaType === MetaBlockKey.BlockCommit) {
                    metaValues.push(block.key);
                    continue;
                }

                // Auto-fill with Git username for SelfAuthor and SelfAssignee
                if (block.metaType === MetaBlockKey.SelfAssignee || block.metaType === MetaBlockKey.SelfAuthor) {
                    const gitUser = getGitUserName();
                    const metaKey = block.metaType === MetaBlockKey.SelfAssignee ? 'assignee' : 'author';
                    metaValues.push(`[${metaKey}: ${gitUser || vscode.l10n.t('unknown')}]`);
                    continue;
                }

                // User input required
                const value = await vscode.window.showInputBox({
                    placeHolder: vscode.l10n.t('enterValueFor', block.label),
                    prompt: vscode.l10n.t('valueLabel', block.metaType)
                });
                
                metaValues.push(`[${block.metaType.toLowerCase()}: ${value || ''}]`);
            }
            
            if (metaValues.length > 0) {
                metaLines = ' ' + metaValues.join(' ');
            }
        }

        // Insert TODO comment
        editor.edit(editBuilder => {
            editor.selections.forEach(sel => {
                editBuilder.replace(sel, `${commentPrefix} TODO: ${prio.key} ${type.key} ${contextPick.key} ${message}${metaLines}`);
            });
        });
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}
