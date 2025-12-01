/**
 * TODO NUKEM Constants
 * Central management of all TODO markers (keys, names, emojis) for consistency
 */

export const Priority = {
    Low: { key: '[low]', name: 'Low', emoji: '🟩' },
    Medium: { key: '[medium]', name: 'Medium', emoji: '🔶' },
    High: { key: '[high]', name: 'High', emoji: '🔴' }
} as const;

export const Type = {
    Feature: { key: '[feature]', name: 'Feature', emoji: '✨' },
    Fix: { key: '[fix]', name: 'Fix', emoji: '🐛' }
} as const;

export const Context = {
    Design: { key: '[design]', name: 'Design', emoji: '🎨' },
    Doc: { key: '[doc]', name: 'Doc', emoji: '📚' },
    Test: { key: '[test]', name: 'Test', emoji: '🧪' },
    Perf: { key: '[perf]', name: 'Perf', emoji: '⚡' },
    Lang: { key: '[lang]', name: 'Lang', emoji: '🌐' },
    Sec: { key: '[sec]', name: 'Sec', emoji: '🔒' },
    Update: { key: '[update]', name: 'Update', emoji: '🔄' },
    Optimize: { key: '[optimize]', name: 'Optimize', emoji: '🛠️' },
    Review: { key: '[review]', name: 'Review', emoji: '👀' }
} as const;

export const Meta = {
    TBD: { key: '[tbd]', name: 'TBD', emoji: '💬' },
    Scope: { key: '[scope]', name: 'Scope', emoji: '🎯' },
    Ticket: { key: '[ticket]', name: 'Ticket', emoji: '🎫' },
    Until: { key: '[until]', name: 'Until', emoji: '📅' },
    Assignee: { key: '[assignee]', name: 'Assignee', emoji: '👤' },
    Author: { key: '[author]', name: 'Author', emoji: '✍️' },
    Version: { key: '[version]', name: 'Version', emoji: '🔖' },
    Docs: { key: '[docs]', name: 'Docs', emoji: '📚' },
    BlockCommit: { key: '[block-commit]', name: 'BlockCommit', emoji: '⛔' }
} as const;

/**
 * Utility functions for constant mapping
 */
export const ConstantUtils = {
    getAllPriorities: () => Object.values(Priority),
    getAllTypes: () => Object.values(Type),
    getAllContexts: () => Object.values(Context),
    
    isPriorityKey: (key: string): boolean => {
        return Object.values(Priority).some(p => p.key === key);
    },
    
    isTypeKey: (key: string): boolean => {
        return Object.values(Type).some(t => t.key === key);
    },
    
    isContextKey: (key: string): boolean => {
        return Object.values(Context).some(c => c.key === key);
    },

    isPriorityEmoji: (emoji: string): boolean => {
        return Object.values(Priority).some(p => p.emoji === emoji);
    },
    
    isTypeEmoji: (emoji: string): boolean => {
        return Object.values(Type).some(t => t.emoji === emoji);
    },
    
    isContextEmoji: (emoji: string): boolean => {
        return Object.values(Context).some(c => c.emoji === emoji);
    }
};
