import React from 'react';
import firstLetterUpperCase from '../utils/first-letter-upper-case';

import SuggestionItem from './SuggestionItem';
import type { ICategorizedSuggestions } from '../types/suggestions.model';
import type { SuggestionClickEmitEvent } from '../types/custom-events.model';

interface ISuggestionsComponentProps {
    categorizedSuggestions: ICategorizedSuggestions[];
    onSuggestionClick: SuggestionClickEmitEvent;
    selectedSuggestionUri: string;
}

export default function Suggestions({ categorizedSuggestions, onSuggestionClick, selectedSuggestionUri }: ISuggestionsComponentProps) {
   const getTranslation = (type: ICategorizedSuggestions['type']) => {
      switch(type) {
         case 'tracks': return Spicetify.Platform.Translations['search.title.tracks'];
         case 'artists': return Spicetify.Platform.Translations['search.title.artists'];
         case 'albums': return Spicetify.Platform.Translations['search.title.albums'];
         case 'playlists': return Spicetify.Platform.Translations['search.title.playlists'];
         default: return type;
      }
   };

   return (
      <div id="power-bar-suggestions">
         <div id="suggestions-container">
            { categorizedSuggestions.map(({ type, items }) => (
               <ul key={type} className="suggestions-category">
                  <h5>{ firstLetterUpperCase(getTranslation(type)) }</h5>

                  { items.map(item => (
                     <SuggestionItem
                        key={item.id}
                        suggestion={item}
                        selected={item.uri === selectedSuggestionUri}
                        onSuggestionClick={onSuggestionClick}
                     />)
                  ) }
               </ul>
            )) }
         </div>
      </div>
   );
}
