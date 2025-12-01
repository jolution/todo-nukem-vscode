import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { Priority, Type, Context } from './shared/constants';

const packageJson = require('../package.json');

export function activate(context: vscode.ExtensionContext) {
    const todoProvider = new TodoTreeDataProvider();
    const treeView = vscode.window.createTreeView('todoNukemView', {
        treeDataProvider: todoProvider
    });

    // Set title with version (TODO NUKEM before already)
    treeView.title = `TODOs v${packageJson.version}`;

    // Command: Show TODOs (focuses TreeView and loads TODOs)
    let showTodosCommand = vscode.commands.registerCommand('todoNukem.showTodos', () => {
        vscode.commands.executeCommand('todoNukemView.focus');
        todoProvider.refresh();
    });

    // Command: Refresh TODOs
    let refreshCommand = vscode.commands.registerCommand('todoNukem.refresh', () => {
        todoProvider.refresh();
    });

    // Command: Filter by Priority
    let filterPriorityCommand = vscode.commands.registerCommand('todoNukem.filterByPriority', async () => {
        const priority = await vscode.window.showQuickPick(
            [
                { label: FILTER_ALL, key: FILTER_ALL },
                { label: `${Priority.High.emoji} ${vscode.l10n.t('highPrio')}`, key: Priority.High.key },
                { label: `${Priority.Medium.emoji} ${vscode.l10n.t('mediumPrio')}`, key: Priority.Medium.key },
                { label: `${Priority.Low.emoji} ${vscode.l10n.t('lowPrio')}`, key: Priority.Low.key }
            ],
            { placeHolder: vscode.l10n.t('selectPriorityFilter') }
        );
        if (priority) {
            todoProvider.setFilterPriority(priority.key);
        }
    });

    // Command: Filter by Type
    let filterTypeCommand = vscode.commands.registerCommand('todoNukem.filterByType', async () => {
        const type = await vscode.window.showQuickPick(
            [
                { label: FILTER_ALL, key: FILTER_ALL },
                { label: `${Type.Feature.emoji} ${vscode.l10n.t('feature')}`, key: Type.Feature.key },
                { label: `${Type.Fix.emoji} ${vscode.l10n.t('fix')}`, key: Type.Fix.key }
            ],
            { placeHolder: vscode.l10n.t('selectTypeFilter') }
        );
        if (type) {
            todoProvider.setFilterType(type.key);
        }
    });

    // Command: Filter by Context
    let filterContextCommand = vscode.commands.registerCommand('todoNukem.filterByContext', async () => {
        const context = await vscode.window.showQuickPick(
            [
                { label: FILTER_ALL, key: FILTER_ALL },
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
            { placeHolder: vscode.l10n.t('selectContextFilter') }
        );
        if (context) {
            todoProvider.setFilterContext(context.key);
        }
    });

    // Command: Filter by Assignee
    let filterAssigneeCommand = vscode.commands.registerCommand('todoNukem.filterByAssignee', async () => {
        const assignee = await vscode.window.showInputBox({
            placeHolder: vscode.l10n.t('exampleName'),
            prompt: vscode.l10n.t('enterAssigneeName'),
            value: todoProvider.getFilterAssignee() === FILTER_ALL ? '' : todoProvider.getFilterAssignee()
        });
        if (assignee !== undefined) {
            todoProvider.setFilterAssignee(assignee || FILTER_ALL);
        }
    });

    // Command: Filter by Author
    let filterAuthorCommand = vscode.commands.registerCommand('todoNukem.filterByAuthor', async () => {
        const author = await vscode.window.showInputBox({
            placeHolder: vscode.l10n.t('exampleName'),
            prompt: vscode.l10n.t('enterAuthorName'),
            value: todoProvider.getFilterAuthor() === FILTER_ALL ? '' : todoProvider.getFilterAuthor()
        });
        if (author !== undefined) {
            todoProvider.setFilterAuthor(author || FILTER_ALL);
        }
    });

    // Command: Open TODO in file
    let openTodoCommand = vscode.commands.registerCommand('todoNukem.openTodo', (todo: TodoItem) => {
        const uri = vscode.Uri.file(todo.filePath);
        vscode.workspace.openTextDocument(uri).then(doc => {
            vscode.window.showTextDocument(doc).then(editor => {
                const position = new vscode.Position(todo.line, 0);
                editor.selection = new vscode.Selection(position, position);
                editor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.InCenter);
            });
        });
    });

    context.subscriptions.push(showTodosCommand, refreshCommand, filterPriorityCommand, filterTypeCommand, filterContextCommand, filterAssigneeCommand, filterAuthorCommand, openTodoCommand, treeView);
    todoProvider.refresh();
}

export function deactivate() {}

const FILTER_ALL = vscode.l10n.t('all');

interface TodoItem {
    text: string;
    priority: string | null;
    type: string | null;
    context: string | null;
    assignee: string | null;
    author: string | null;
    filePath: string;
    line: number;
}

class TodoTreeDataProvider implements vscode.TreeDataProvider<TodoTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<TodoTreeItem | undefined | null | void> = new vscode.EventEmitter<TodoTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<TodoTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private todos: TodoItem[] = [];
    private filterPriority: string = FILTER_ALL;
    private filterType: string = FILTER_ALL;
    private filterContext: string = FILTER_ALL;
    private filterAssignee: string = FILTER_ALL;
    private filterAuthor: string = FILTER_ALL;

    async refresh(): Promise<void> {
        this.todos = [];
        await this.scanWorkspace();
        this._onDidChangeTreeData.fire();
    }

    setFilterPriority(filter: string): void {
        this.filterPriority = filter;
        this._onDidChangeTreeData.fire();
    }

    setFilterType(filter: string): void {
        this.filterType = filter;
        this._onDidChangeTreeData.fire();
    }

    setFilterContext(filter: string): void {
        this.filterContext = filter;
        this._onDidChangeTreeData.fire();
    }

    getFilterAssignee(): string {
        return this.filterAssignee;
    }

    setFilterAssignee(filter: string): void {
        this.filterAssignee = filter;
        this._onDidChangeTreeData.fire();
    }

    getFilterAuthor(): string {
        return this.filterAuthor;
    }

    setFilterAuthor(filter: string): void {
        this.filterAuthor = filter;
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: TodoTreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: TodoTreeItem): Thenable<TodoTreeItem[]> {
        if (!element) {
            return Promise.resolve(this.getFilteredTodos());
        }
        return Promise.resolve([]);
    }

    private getFilteredTodos(): TodoTreeItem[] {
        let filtered = this.todos;

        // Filter by Priority (compare keys directly)
        if (this.filterPriority !== FILTER_ALL) {
            filtered = filtered.filter(todo => todo.priority === this.filterPriority);
        }

        // Filter by Type (compare keys directly)
        if (this.filterType !== FILTER_ALL) {
            filtered = filtered.filter(todo => todo.type === this.filterType);
        }

        // Filter by Context (compare keys directly)
        if (this.filterContext !== FILTER_ALL) {
            filtered = filtered.filter(todo => todo.context === this.filterContext);
        }

        // Filter by Assignee
        if (this.filterAssignee !== FILTER_ALL) {
            filtered = filtered.filter(todo => 
                todo.assignee && todo.assignee.toLowerCase().includes(this.filterAssignee.toLowerCase())
            );
        }

        // Filter by Author
        if (this.filterAuthor !== FILTER_ALL) {
            filtered = filtered.filter(todo => 
                todo.author && todo.author.toLowerCase().includes(this.filterAuthor.toLowerCase())
            );
        }

        // Sort: High > Medium > Low > no priority
        const priorityOrder: { [key: string]: number } = {
            '[high]': 1,
            '[medium]': 2,
            '[low]': 3
        };

        filtered.sort((a, b) => {
            const orderA = a.priority ? (priorityOrder[a.priority] || 999) : 999;
            const orderB = b.priority ? (priorityOrder[b.priority] || 999) : 999;
            return orderA - orderB;
        });

        return filtered.map(todo => new TodoTreeItem(todo));
    }

    private async scanWorkspace(): Promise<void> {
        this.todos = [];

        if (!vscode.workspace.workspaceFolders) {
            return;
        }

        for (const folder of vscode.workspace.workspaceFolders) {
            await this.scanDirectory(folder.uri.fsPath);
        }
    }

    private async scanDirectory(dirPath: string): Promise<void> {
        const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);

            // Ignore specific directories
            if (entry.isDirectory()) {
                if (this.shouldIgnoreDirectory(entry.name)) {
                    continue;
                }
                await this.scanDirectory(fullPath);
            } else if (entry.isFile()) {
                if (this.shouldScanFile(entry.name)) {
                    await this.scanFile(fullPath);
                }
            }
        }
    }

    private shouldIgnoreDirectory(name: string): boolean {
        const ignoredDirs = [
            'node_modules',
            '.git',
            'dist',
            'build',
            'out',
            '.vscode',
            '.history',
            'coverage'
        ];
        return ignoredDirs.includes(name);
    }

    private shouldScanFile(name: string): boolean {
        const extensions = [
            '.ts', '.tsx', '.js', '.jsx',
            '.py', '.java', '.cs', '.cpp', '.c', '.h',
            '.go', '.rs', '.swift', '.kt',
            '.php', '.rb', '.vue', '.svelte',
            '.html', '.css', '.scss', '.sass',
            '.json', '.md', '.txt'
        ];
        return extensions.some(ext => name.endsWith(ext));
    }

    private async scanFile(filePath: string): Promise<void> {
        try {
            const content = await fs.promises.readFile(filePath, 'utf-8');
            const lines = content.split('\n');

            lines.forEach((line, index) => {
                // Find TODO: and extract the rest
                const todoMatch = line.match(/TODO:?\s+(.+)/i);
                if (todoMatch) {
                    let fullText = todoMatch[1].trim();
                    // Remove trailing */ or -->
                    fullText = fullText.replace(/(\*\/|-->)\s*$/, '').trim();
                    
                    if (fullText.length > 0) {
                        // TODO NUKEM Format: [low] [feature] [design] Message [Meta]
                        // Extract the first 3 keys (Priority, Type, Context)
                        const parts = fullText;
                        
                        // Priority keys
                        const priorityKeys = Object.values(Priority).map(p => p.key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
                        const priorityMatch = parts.match(new RegExp(`^(${priorityKeys.join('|')})`));
                        const priority = priorityMatch ? priorityMatch[1] : null;
                        
                        // Type keys
                        const typeKeys = Object.values(Type).map(t => t.key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
                        const typeMatch = parts.match(new RegExp(`^(?:${priorityKeys.join('|')})?\\s*(${typeKeys.join('|')})`));
                        const type = typeMatch ? typeMatch[1] : null;
                        
                        // Context keys
                        const contextKeys = Object.values(Context).map(c => c.key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
                        const contextMatch = parts.match(new RegExp(`^(?:${priorityKeys.join('|')})?\\s*(?:${typeKeys.join('|')})?\\s*(${contextKeys.join('|')})`));
                        const context = contextMatch ? contextMatch[1] : null;
                        
                        // Extract Assignee from [assignee: value] (colon followed by exactly one space)
                        const assigneeMatch = parts.match(/\[(?:assignee|👤):\s([^\]]+)\]/);
                        const assignee = assigneeMatch ? assigneeMatch[1].trim() : null;
                        
                        // Extract Author from [author: value] (colon followed by exactly one space)
                        const authorMatch = parts.match(/\[(?:author|✍️):\s([^\]]+)\]/);
                        const author = authorMatch ? authorMatch[1].trim() : null;
                        
                        this.todos.push({
                            text: fullText,
                            priority: priority,
                            type: type,
                            context: context,
                            assignee: assignee,
                            author: author,
                            filePath: filePath,
                            line: index
                        });
                    }
                }
            });
        } catch (error) {
            // Silent error handling for file scanning
        }
    }
}

class TodoTreeItem extends vscode.TreeItem {
    constructor(public readonly todo: TodoItem) {
        const fileName = path.basename(todo.filePath);
        
        super(todo.text, vscode.TreeItemCollapsibleState.None);

        this.description = `${fileName}:${todo.line + 1}`;
        this.tooltip = `${todo.filePath}\nLine: ${todo.line + 1}\n\n${todo.text}`;
        
        this.command = {
            command: 'todoNukem.openTodo',
            title: 'Open TODO',
            arguments: [todo]
        };

        // Icon based on priority
        if (todo.priority === Priority.High.key) {
            this.iconPath = new vscode.ThemeIcon('error', new vscode.ThemeColor('errorForeground'));
        } else if (todo.priority === Priority.Medium.key) {
            this.iconPath = new vscode.ThemeIcon('warning', new vscode.ThemeColor('editorWarning.foreground'));
        } else if (todo.priority === Priority.Low.key) {
            this.iconPath = new vscode.ThemeIcon('pass', new vscode.ThemeColor('testing.iconPassed'));
        } else {
            this.iconPath = new vscode.ThemeIcon('comment');
        }

        this.contextValue = 'todoItem';
    }
}
