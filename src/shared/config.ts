import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { Priority, Type, Context, Meta } from './constants';

type DisplayMode = 'emoji' | 'text' | 'emoji-text';

interface TodoNukemConfig {
    displayMode?: DisplayMode;
    ticketBaseUrl?: string;
    emojis?: {
        priority?: {
            low?: string;
            medium?: string;
            high?: string;
        };
        type?: {
            feature?: string;
            fix?: string;
        };
        context?: {
            design?: string;
            doc?: string;
            test?: string;
            perf?: string;
            lang?: string;
            sec?: string;
            update?: string;
            optimize?: string;
            review?: string;
        };
        meta?: {
            tbd?: string;
            scope?: string;
            ticket?: string;
            until?: string;
            assignee?: string;
            author?: string;
            version?: string;
            docs?: string;
            blockCommit?: string;
        };
    };
}

let cachedConfig: TodoNukemConfig | null = null;

/**
 * Load todonukem.json from workspace root if it exists
 */
export function loadConfig(): TodoNukemConfig {
    if (cachedConfig) {
        return cachedConfig;
    }

    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        return {};
    }

    const configPath = path.join(workspaceFolders[0].uri.fsPath, 'todonukem.json');
    
    try {
        if (fs.existsSync(configPath)) {
            const content = fs.readFileSync(configPath, 'utf-8');
            cachedConfig = JSON.parse(content);
            return cachedConfig || {};
        }
    } catch (error) {
        console.error('Failed to load todonukem.json:', error);
    }

    return {};
}

/**
 * Get emoji with todonukem.json override support
 */
export function getEmoji(category: 'priority' | 'type' | 'context' | 'meta', key: string): string {
    // Check for override in todonukem.json
    const config = loadConfig();
    let override: string | undefined;
    
    if (config.emojis) {
        const categoryConfig = config.emojis[category];
        if (categoryConfig) {
            override = (categoryConfig as any)[key];
        }
    }
    
    if (override && override.trim() !== '') {
        return override;
    }

    // Fallback to default emojis from constants
    switch (category) {
        case 'priority':
            const priorityMap: { [key: string]: string } = {
                'low': Priority.Low.emoji,
                'medium': Priority.Medium.emoji,
                'high': Priority.High.emoji
            };
            return priorityMap[key] || '';
        case 'type':
            const typeMap: { [key: string]: string } = {
                'feature': Type.Feature.emoji,
                'fix': Type.Fix.emoji
            };
            return typeMap[key] || '';
        case 'context':
            const contextMap: { [key: string]: string } = {
                'design': Context.Design.emoji,
                'doc': Context.Doc.emoji,
                'test': Context.Test.emoji,
                'perf': Context.Perf.emoji,
                'lang': Context.Lang.emoji,
                'sec': Context.Sec.emoji,
                'update': Context.Update.emoji,
                'optimize': Context.Optimize.emoji,
                'review': Context.Review.emoji
            };
            return contextMap[key] || '';
        case 'meta':
            const metaMap: { [key: string]: string } = {
                'tbd': Meta.TBD.emoji,
                'scope': Meta.Scope.emoji,
                'ticket': Meta.Ticket.emoji,
                'until': Meta.Until.emoji,
                'assignee': Meta.Assignee.emoji,
                'author': Meta.Author.emoji,
                'version': Meta.Version.emoji,
                'docs': Meta.Docs.emoji,
                'block-commit': Meta.BlockCommit.emoji
            };
            return metaMap[key] || '';
    }

}

/**
 * Get display mode from config
 */
export function getDisplayMode(): DisplayMode {
    const config = loadConfig();
    return config.displayMode || 'emoji';
}

/**
 * Get ticket base URL from config
 */
export function getTicketBaseUrl(): string | undefined {
    const config = loadConfig();
    return config.ticketBaseUrl;
}

/**
 * Get name/label for a key
 */
export function getName(category: 'priority' | 'type' | 'context' | 'meta', key: string): string {
    switch (category) {
        case 'priority':
            const priorityMap: { [key: string]: string } = {
                'low': Priority.Low.name,
                'medium': Priority.Medium.name,
                'high': Priority.High.name
            };
            return priorityMap[key] || '';
        case 'type':
            const typeMap: { [key: string]: string } = {
                'feature': Type.Feature.name,
                'fix': Type.Fix.name
            };
            return typeMap[key] || '';
        case 'context':
            const contextMap: { [key: string]: string } = {
                'design': Context.Design.name,
                'doc': Context.Doc.name,
                'test': Context.Test.name,
                'perf': Context.Perf.name,
                'lang': Context.Lang.name,
                'sec': Context.Sec.name,
                'update': Context.Update.name,
                'optimize': Context.Optimize.name,
                'review': Context.Review.name
            };
            return contextMap[key] || '';
        case 'meta':
            const metaMap: { [key: string]: string } = {
                'tbd': Meta.TBD.name,
                'scope': Meta.Scope.name,
                'ticket': Meta.Ticket.name,
                'until': Meta.Until.name,
                'assignee': Meta.Assignee.name,
                'author': Meta.Author.name,
                'version': Meta.Version.name,
                'docs': Meta.Docs.name,
                'blockCommit': Meta.BlockCommit.name
            };
            return metaMap[key] || '';
    }
}

/**
 * Format display text based on display mode
 */
export function formatDisplay(category: 'priority' | 'type' | 'context' | 'meta', key: string): string {
    const mode = getDisplayMode();
    const emoji = getEmoji(category, key);
    const name = getName(category, key);
    
    switch (mode) {
        case 'emoji':
            return emoji;
        case 'text':
            return name;
        case 'emoji-text':
            return `${emoji}-${name.toLowerCase()}`;
        default:
            return emoji;
    }
}

/**
 * Clear cached config (useful when config file changes)
 */
export function clearConfigCache(): void {
    cachedConfig = null;
}
