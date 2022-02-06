import { SearchCategories } from "./categories.model";
import { ISuggestion } from "./suggestions.model";

export type ISpotifySearchResponse = {
    [key in SearchCategories]: ISpotifySearchResult
}

export interface ISpotifySearchResult {
    href: string;
    items: ISuggestion[];
    limit: number;
    next: string;
    offset: number;
    previous: null;
    total: number;
}
