import React from 'react';
import classnames from 'classnames';

import type { ISuggestion } from '../types/suggestions.model';
import type { SuggestionClickEmitEvent } from '../types/custom-events.model';

interface ISuggestionComponentProps {
    suggestion: ISuggestion;
    onSuggestionClick: SuggestionClickEmitEvent;
    selected: boolean;
}

export default function SuggestionItem({ suggestion, onSuggestionClick, selected }: ISuggestionComponentProps) {
   const hasInfo = suggestion.__typename === 'Track' || suggestion.__typename === 'Album';
   const imgSrc = (() => {
      switch(suggestion.__typename) {
         case 'Track':
            return suggestion.albumOfTrack?.coverArt?.sources[0].url;
         case 'Album':
            return suggestion.coverArt?.sources[0].url;
         case 'Artist':
            return suggestion.visuals?.avatarImage?.sources[0].url;
         case 'Playlist':
            return suggestion.images?.items[0]?.sources[0].url;
         default:
            return undefined;
      }
   })();
   const suggestionName = suggestion.__typename === 'Artist' ? suggestion.profile.name : suggestion.name;

   return (
      <li
         className={classnames('suggestion-item', { 'has-info': hasInfo, 'suggestion-item__active': selected })}
         onClick={(e) => onSuggestionClick(suggestion, e.nativeEvent)}
      >
         {imgSrc
            ? <img src={imgSrc} alt={suggestionName} className="suggestion-item__img" />
            : <div className="suggestion-item__img"></div>}
         <div className="suggestion-item__text">
            <span>{suggestionName}</span>
            {hasInfo && <span>{ suggestion.artists?.items.map(artist => artist.profile.name).join(', ') }</span>}
         </div>
      </li>
   );
}
