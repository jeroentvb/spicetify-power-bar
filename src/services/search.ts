import type { ICategorizedSuggestions, ISearchReturnType, ISuggestion } from '../types/suggestions.model';

export default async function search(searchQuery: string, limit: string): Promise<ISearchReturnType> {
   const query = encodeURIComponent(searchQuery.trim());
   const res: SpotifyApi.SearchResponse = await Spicetify.CosmosAsync.get(`https://api.spotify.com/v1/search?q=${query}&type=album,artist,playlist,track&limit=${limit}&include_external=audio`);

   return parse(res);
}

function parse(res: SpotifyApi.SearchResponse): ISearchReturnType {
   const categorizedSuggestions = Object.entries(res)
      .filter(([_key, value]) => value.items.length > 0)
      .map(([key, value]) => ({ type: key, items: value.items.filter(Boolean) } as ICategorizedSuggestions))
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
      }, [] as ICategorizedSuggestions[]);

   const suggestions = categorizedSuggestions.flatMap((category) => category.items as ISuggestion[]);

   return { categorizedSuggestions, suggestions };
}