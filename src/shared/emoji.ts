/**
 * TODO NUKEM Emoji Definitions
 * Central management of all emojis for consistency between Generator and Viewer
 */

export enum PriorityEmoji {
    Low = '🟩',
    Medium = '🔶',
    High = '🔴'
}

export enum TypeEmoji {
    Feature = '✨',
    Fix = '🐛'
}

export enum ContextEmoji {
    Design = '🎨',
    Doc = '📚',
    Test = '🧪',
    Perf = '⚡',
    Lang = '🌐',
    Sec = '🔒',
    Update = '🔄',
    Optimize = '🛠️',
    Review = '👀'
}

export enum MetaEmoji {
    TBD = '💬',
    Scope = '🎯',
    Ticket = '🎫',
    Until = '📅',
    Assignee = '👤',
    Author = '✍️',
    Version = '🔖',
    Docs = '📚',
    BlockCommit = '🛑'
}

/**
 * Utility functions for emoji mapping
 */
export const EmojiUtils = {
    getAllPriorities: () => Object.values(PriorityEmoji),
    getAllTypes: () => Object.values(TypeEmoji),
    getAllContexts: () => Object.values(ContextEmoji),
    
    isPriority: (emoji: string): emoji is PriorityEmoji => {
        return Object.values(PriorityEmoji).includes(emoji as PriorityEmoji);
    },
    
    isType: (emoji: string): emoji is TypeEmoji => {
        return Object.values(TypeEmoji).includes(emoji as TypeEmoji);
    },
    
    isContext: (emoji: string): emoji is ContextEmoji => {
        return Object.values(ContextEmoji).includes(emoji as ContextEmoji);
    }
};
