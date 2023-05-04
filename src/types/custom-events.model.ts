import type { ISuggestion } from './suggestions.model';

export type SuggestionClickEmitEvent = (suggestion: ISuggestion, event: MouseEvent) => void;
