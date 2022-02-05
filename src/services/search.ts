import { ICategorizedSuggestion } from '../types/suggestions.model';

export async function search(searchQuery: string): Promise<ICategorizedSuggestion[]> {
    const query = encodeURIComponent(searchQuery.trim());
    const res = await Spicetify.CosmosAsync.get(`https://api.spotify.com/v1/search?q=${query}&type=album,artist,playlist,track&limit=3&include_external=audio`)
    
    // const { suggestions, flattenedSuggestions } = this.parseSuggestions(res);

    // this.renderSuggestions(suggestions);
    // this.flattenedSuggestions = flattenedSuggestions;

    return parse(res);
}

function parse(res: any): ICategorizedSuggestion[] {
    console.log('power bar search result response', res);
    return Object.entries(res)
        // @ts-ignore
        .filter(([_key, value]) => value.items.length > 0)
        // @ts-ignore
        .map(([key, value]) => ({ type: key, items: value.items }))
        .reduce((final, item) => {
            // TODO surely there's a better way to do this..
            switch(item.type) {
                case 'tracks': {
                    // @ts-ignore
                    final[0] = item;
                    break;
                }
                case 'artists': {
                    // @ts-ignore
                    final[1] = item;
                    break;
                }
                case 'albums': {
                    // @ts-ignore
                    final[2] = item;
                    break;
                }
                case 'playlists': {
                    // @ts-ignore
                    final[3] = item;
                    break;
                }
            }

            return final;
        }, []);
}

// const debouncedSearch = debounce();

// export default debouncedSearch;