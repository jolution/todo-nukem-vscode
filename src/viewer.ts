import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { PriorityEmoji, TypeEmoji, ContextEmoji, MetaEmoji, EmojiUtils } from './shared/emoji';

export function activate(context: vscode.ExtensionContext) {
    const todoProvider = new TodoTreeDataProvider();
    const treeView = vscode.window.createTreeView('todoNukemView', {
        treeDataProvider: todoProvider
    });

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
            [FILTER_ALL, `${PriorityEmoji.High} ${vscode.l10n.t('highPrio')}`, `${PriorityEmoji.Medium} ${vscode.l10n.t('mediumPrio')}`, `${PriorityEmoji.Low} ${vscode.l10n.t('lowPrio')}`],
            { placeHolder: vscode.l10n.t('selectPriorityFilter') }
        );
        if (priority) {
            todoProvider.setFilterPriority(priority);
        }
    });

    // Command: Filter by Type
    let filterTypeCommand = vscode.commands.registerCommand('todoNukem.filterByType', async () => {
        const type = await vscode.window.showQuickPick(
            [FILTER_ALL, `${TypeEmoji.Feature} ${vscode.l10n.t('feature')}`, `${TypeEmoji.Fix} ${vscode.l10n.t('fix')}`],
            { placeHolder: vscode.l10n.t('selectTypeFilter') }
        );
        if (type) {
            todoProvider.setFilterType(type);
        }
    });

    // Command: Filter by Context
    let filterContextCommand = vscode.commands.registerCommand('todoNukem.filterByContext', async () => {
        const context = await vscode.window.showQuickPick(
            [
                FILTER_ALL, 
                `${ContextEmoji.Design} ${vscode.l10n.t('design')}`, 
                `${ContextEmoji.Doc} ${vscode.l10n.t('doc')}`, 
                `${ContextEmoji.Test} ${vscode.l10n.t('test')}`, 
                `${ContextEmoji.Perf} ${vscode.l10n.t('perf')}`, 
                `${ContextEmoji.Lang} ${vscode.l10n.t('lang')}`, 
                `${ContextEmoji.Sec} ${vscode.l10n.t('sec')}`, 
                `${ContextEmoji.Update} ${vscode.l10n.t('update')}`, 
                `${ContextEmoji.Optimize} ${vscode.l10n.t('optimize')}`, 
                `${ContextEmoji.Review} ${vscode.l10n.t('review')}`
            ],
            { placeHolder: vscode.l10n.t('selectContextFilter') }
        );
        if (context) {
            todoProvider.setFilterContext(context);
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

        // Filter by Priority
        if (this.filterPriority !== FILTER_ALL) {
            const priorityEmoji = this.filterPriority.split(' ')[0];
            filtered = filtered.filter(todo => todo.priority === priorityEmoji);
        }

        // Filter by Type
        if (this.filterType !== FILTER_ALL) {
            const typeEmoji = this.filterType.split(' ')[0];
            filtered = filtered.filter(todo => todo.type === typeEmoji);
        }

        // Filter by Context
        if (this.filterContext !== FILTER_ALL) {
            const contextEmoji = this.filterContext.split(' ')[0];
            filtered = filtered.filter(todo => todo.context === contextEmoji);
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
            '🔴': 1,
            '🔶': 2,
            '🟩': 3
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
                        // TODO NUKEM Format: 🔴 ✨ 🎨 Message [Meta]
                        // Extract the first 3 emojis (Priority, Type, Context)
                        const parts = fullText;
                        
                        // Priority with enum values
                        const priorityMatch = parts.match(new RegExp(`^(${EmojiUtils.getAllPriorities().join('|')})`));
                        const priority = priorityMatch ? priorityMatch[1] : null;
                        
                        // Type with enum values
                        const typeMatch = parts.match(new RegExp(`^(?:${EmojiUtils.getAllPriorities().join('|')})?\\s*(${EmojiUtils.getAllTypes().join('|')})`));
                        const type = typeMatch ? typeMatch[1] : null;
                        
                        // Context with enum values
                        const contextMatch = parts.match(new RegExp(`^(?:${EmojiUtils.getAllPriorities().join('|')})?\\s*(?:${EmojiUtils.getAllTypes().join('|')})?\\s*(${EmojiUtils.getAllContexts().join('|')})`));
                        const context = contextMatch ? contextMatch[1] : null;
                        
                        // Extract Assignee from [👤 Name]
                        const assigneeMatch = parts.match(new RegExp(`\\[${MetaEmoji.Assignee}\\s+([^\\]]+)\\]`));
                        const assignee = assigneeMatch ? assigneeMatch[1].trim() : null;
                        
                        // Extract Author from [✍️ Name]
                        const authorMatch = parts.match(new RegExp(`\\[${MetaEmoji.Author}\\s+([^\\]]+)\\]`));
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
        if (todo.priority === PriorityEmoji.High) {
            this.iconPath = new vscode.ThemeIcon('error', new vscode.ThemeColor('errorForeground'));
        } else if (todo.priority === PriorityEmoji.Medium) {
            this.iconPath = new vscode.ThemeIcon('warning', new vscode.ThemeColor('editorWarning.foreground'));
        } else if (todo.priority === PriorityEmoji.Low) {
            this.iconPath = new vscode.ThemeIcon('pass', new vscode.ThemeColor('testing.iconPassed'));
        } else {
            this.iconPath = new vscode.ThemeIcon('comment');
        }

        this.contextValue = 'todoItem';
    }
}
