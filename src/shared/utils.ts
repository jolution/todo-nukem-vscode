import * as vscode from 'vscode';

export enum MetaBlockKey {
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

export interface MetaBlock extends vscode.QuickPickItem {
    key: string;
    metaType: MetaBlockKey;
}

/**
 * Retrieves the Git username from the current workspace
 */
export function getGitUserName(): string {
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

/**
 * Returns the appropriate comment prefix for the given language
 */
export function getCommentPrefix(languageId: string): string {
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
