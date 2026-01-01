import type { ItemV2, SearchResponse } from '../types/search-modal-results.model';
import type { ICategorizedSuggestions, ISearchReturnType } from '../types/suggestions.model';

export default async function search(searchQuery: string, limit: number): Promise<ISearchReturnType> {
   const res: SearchResponse = await Spicetify.GraphQL.Request(
      Spicetify.GraphQL.Definitions.searchModalResults,
      {
         'limit': 50,
         'numberOfTopResults': 4 * limit,
         'offset': 0,
         'searchTerm': searchQuery.trim() || '',
         'includeAuthors': false
      }
   );

   return parse(res.data.searchV2.topResultsV2.itemsV2);
}

function parse(res: ItemV2[]): ISearchReturnType {
   const suggestions = res
      .map((item) => item.item.data)
      .filter((item) => ['Artist', 'Playlist', 'Album', 'Track'].includes(item.__typename))
      .sort((a, b) => {
         const order = ['Track', 'Artist', 'Album', 'Playlist'];
         return order.indexOf(a.__typename) - order.indexOf(b.__typename);
      });
   const categorizedSuggestions = Object.groupBy(suggestions, (item) => item.__typename);

   // Ideally we would stop after groupBy, but the rest of the code expects the following format.
   const finalCategorizedSuggestions: ICategorizedSuggestions[] = Object.entries(categorizedSuggestions)
      .map(([key, items]) => ({ type: key, items } as ICategorizedSuggestions));

   return { categorizedSuggestions: finalCategorizedSuggestions, suggestions };
}
