import type { ISpotifySearchResponse } from '../types/search-response.model';
import type { ICategorizedSuggestion, ISearchReturnType } from '../types/suggestions.model';

export default async function search(searchQuery: string): Promise<ISearchReturnType> {
    const query = encodeURIComponent(searchQuery.trim());
    const res: ISpotifySearchResponse = await Spicetify.CosmosAsync.get(`https://api.spotify.com/v1/search?q=${query}&type=album,artist,playlist,track&limit=3&include_external=audio`)
    
    // const { suggestions, flattenedSuggestions } = this.parseSuggestions(res);

    // this.renderSuggestions(suggestions);
    // this.flattenedSuggestions = flattenedSuggestions;

    return parse(res);
}

function parse(res: ISpotifySearchResponse): ISearchReturnType {
    const categorizedSuggestions = Object.entries(res)
        .filter(([_key, value]) => value.items.length > 0)
        .map(([key, value]) => ({ type: key, items: value.items }))
        .reduce((final, item) => {
            // TODO surely there's a better way to do this..
            switch(item.type) {
                case 'tracks': {
                    final[0] = item;
                    break;
                }
                case 'artists': {
                    final[1] = item;
                    break;
                }
                case 'albums': {
                    final[2] = item;
                    break;
                }
                case 'playlists': {
                    final[3] = item;
                    break;
                }
            }

            return final;
        }, [] as ICategorizedSuggestion[]);

    const suggestions = categorizedSuggestions.flatMap((category) => category.items);

    return { categorizedSuggestions, suggestions };
}