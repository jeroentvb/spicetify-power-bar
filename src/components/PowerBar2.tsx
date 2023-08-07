import React, { KeyboardEventHandler, createRef, useEffect, useState } from 'react';
import { debounce } from 'lodash-es';
import { SettingsSection } from 'spcr-settings';
import classnames from 'classnames';

import scrollIntoViewIfNeeded from '../utils/scroll-into-view';
import navigateUsingUri from '../utils/navigate-using-uri';
import search from '../services/search';
import showWhatsNew from '../services/whats-new';
import Suggestions from './Suggestions';
import { getSettings } from '../services/get-settings';

import type { ICategorizedSuggestions, ISuggestion } from '../types/suggestions.model';
import type { SuggestionClickEmitEvent } from '../types/custom-events.model';
import { ADD_TO_QUEUE, IS_INPUT_REGEX, KEY_COMBO, RESULTS_PER_CATEGORY } from '../constants';

export default function PowerBar() {
   const [active, setActive] = useState(false);
   const [categorizedSuggestions, setCategorizedSuggestions] = useState<ICategorizedSuggestions[]>([]);
   const [selectedSuggestionUri, setSelectedSuggestionUri] = useState('');

   const isMac = Spicetify.Platform.PlatformData.os_name === 'osx';

   let suggestions: ISuggestion[] = [];

   const searchInput = createRef<HTMLInputElement>();

   let previousSearchValue = '';

   let selectedSuggestionIndex = 0;

   const settings: SettingsSection = getSettings(isMac);

   const setSelectedSuggestionIndex = (index: number) => {
      if (index === -1) index = suggestions.length - 1;
      if (index === suggestions.length) index = 0;
      selectedSuggestionIndex = index;

      setSelectedSuggestionUri(suggestions[index].uri);
      const activeSuggestion = document.getElementsByClassName('suggestion-item__active')[0] as HTMLElement;
      const suggestionsElement = document.getElementById('power-bar-suggestions') as HTMLDivElement;
      scrollIntoViewIfNeeded(activeSuggestion, suggestionsElement);
   };

   /**
    * Component init hook
    */
   useEffect(() => {
      settings.pushSettings();

      showWhatsNew();

      document.addEventListener('keydown', (e) => {
         if (!isActivationKeyCombo(e)) return;

         e.preventDefault();
         togglePowerBar();
      });
   }, []);

   const debouncedSearch = debounce(async () => {
      const limit: string = settings.getFieldValue(RESULTS_PER_CATEGORY);
      const res = await search(searchInput.current?.value as string, limit);

      setCategorizedSuggestions(res.categorizedSuggestions);
      suggestions = res.suggestions;
      setSelectedSuggestionIndex(0);
   }, 300);

   const onSuggestionClick: SuggestionClickEmitEvent = (uri, e) => {
      onSelectSuggestion(uri, e);
   };

   const onSelectSuggestion = async ({ id, uri, type }: ISuggestion, { metaKey, ctrlKey }: KeyboardEvent | MouseEvent) => {
      // Play item/add to queue if modifier key is held
      if (isMac && metaKey || !isMac && ctrlKey) {
         const addToQueue = settings.getFieldValue(ADD_TO_QUEUE);
         if (addToQueue) {
            const handleSuccess = () => {
               Spicetify.showNotification('Added to queue');
               togglePowerBar();
            };

            try {
               switch(type) {
                  case 'track':
                     await Spicetify.CosmosAsync.post(`https://api.spotify.com/v1/me/player/queue?uri=${uri}`);

                     handleSuccess();
                     break;
                  case 'album': {
                     const album: SpotifyApi.AlbumTracksResponse = await Spicetify.CosmosAsync.get(`https://api.spotify.com/v1/albums/${id}/tracks?limit=50`);
                     await Promise.all(album.items.map(async ({ uri }) => {
                        await Spicetify.CosmosAsync.post(`https://api.spotify.com/v1/me/player/queue?uri=${uri}`);
                     }));

                     handleSuccess();
                     break;
                  }
                  default:
                     Spicetify.showNotification('This item can\'t be added to the queue', true);
                     break;
               }
            } catch (err) {
               togglePowerBar();
               Spicetify.showNotification('Something went wrong', true);
               console.error(err);
            }
         } else {
            Spicetify.Player.playUri(uri);
         }

         return;
      }

      navigateUsingUri(uri);
      togglePowerBar();
   };

   const togglePowerBar = () => {
      setActive((active) => !active);

      if (active && searchInput.current) {
         searchInput.current.focus();
         searchInput.current.value = '';
      } else {
         clearSuggestions();
      }
   };

   const clearSuggestions = () => {
      setCategorizedSuggestions([]);
      suggestions = [];
   };

   const onInput: KeyboardEventHandler<HTMLInputElement> = (event) => {
      if (isActivationKeyCombo(event.nativeEvent)) return;

      const { currentTarget, key, shiftKey } = event;
      let trimmedValue = currentTarget.value.trim();
      if (IS_INPUT_REGEX.test(key)) trimmedValue = trimmedValue + key;

      // Clear input or hide power bar when esc is pressed
      if (key === 'Escape') {
         if (currentTarget.value) {
            currentTarget.value = '';
            clearSuggestions();
         } else {
            togglePowerBar();
         }
         return;
      }

      // Handle arrow keys
      if (key === 'ArrowUp') {
         event.preventDefault();
         setSelectedSuggestionIndex(selectedSuggestionIndex - 1);
         return;
      }
      if (key === 'ArrowDown') {
         event.preventDefault();
         setSelectedSuggestionIndex(selectedSuggestionIndex + 1);
         return;
      }

      if (key === 'Tab' && shiftKey) {
         // Todo document this shit
         event.preventDefault();

         const currentSuggestionType = suggestions[selectedSuggestionIndex].type;
         let nextSuggestionIndex: number | undefined = undefined;
         let i = selectedSuggestionIndex;

         while (!nextSuggestionIndex) {
            // Tab from first to last suggestion type
            if (i === -1) i = suggestions.length - 1; // Js array numbering..
            const suggestion = suggestions[i];

            if (suggestion.type !== currentSuggestionType) {
               // By default this gets the last suggestion of the different category type, so will need to jump to the first one.
               nextSuggestionIndex = i - (settings.getFieldValue<number>(RESULTS_PER_CATEGORY) - 1);
               break;
            }

            i--;
         }

         setSelectedSuggestionIndex(nextSuggestionIndex);

         return;
      }

      if (key === 'Tab') {
         event.preventDefault();

         const currentSuggestionType = suggestions[selectedSuggestionIndex].type;
         let nextSuggestionIndex = 0;

         for (let i = selectedSuggestionIndex; i < suggestions.length; i++) {
            const suggestion = suggestions[i];

            if (suggestion.type !== currentSuggestionType) {
               nextSuggestionIndex = i;
               break;
            }
         }

         setSelectedSuggestionIndex(nextSuggestionIndex);

         return;
      }

      if (key === 'Enter') {
         if (suggestions) {
            const suggestion = suggestions[selectedSuggestionIndex];
            onSelectSuggestion(suggestion, event.nativeEvent);
            return;
         }
      }

      if (!trimmedValue || trimmedValue.length < 2) {
         clearSuggestions();
         return;
      }

      if (trimmedValue === previousSearchValue) return;

      previousSearchValue = trimmedValue;
      debouncedSearch();
   };

   const isActivationKeyCombo = (event: KeyboardEvent): boolean => {
      const el = event.target as Element | null;
      // Prevent triggering the power bar in input fields. Such as search bar and settings page
      if (el?.tagName === 'INPUT' && el.id !== 'power-bar-search') return false;

      const [modifier, activationKey]: string[] = settings.getFieldValue(KEY_COMBO);

      return !!event[modifier as 'key'] && event.code === activationKey;
   };

   return (
      <div id="power-bar-container" className={classnames({'hidden': !active})} onClick={togglePowerBar}>
         <div id="power-bar-wrapper" onClick={(e) => e.stopPropagation()}>
            <input
               ref={searchInput}
               type="text"
               id="power-bar-search"
               placeholder="Search Spotify"
               className={classnames({ 'has-suggestions': categorizedSuggestions.length > 0 })}
               onKeyDown={onInput}
            />
            {
               categorizedSuggestions.length > 0 &&
               <Suggestions
                  categorizedSuggestions={categorizedSuggestions}
                  selectedSuggestionUri={selectedSuggestionUri}
                  onSuggestionClick={onSuggestionClick}
               />
            }
         </div>
      </div>
   );
}
