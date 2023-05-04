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
   return (
      <div id="power-bar-suggestions">
         <div id="suggestions-container">
            { categorizedSuggestions.map(({ type, items }) => (
               <ul key={type} className="suggestions-category">
                  <h5>{ firstLetterUpperCase(type) }</h5>

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
