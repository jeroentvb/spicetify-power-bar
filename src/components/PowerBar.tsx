import React, { KeyboardEventHandler } from 'react';
import { debounce } from 'lodash-es';
import { SettingsSection } from 'spcr-settings';
import classnames from 'classnames';

import scrollIntoViewIfNeeded from '../utils/scroll-into-view';
import navigateUsingUri from '../utils/navigate-using-uri';
import search from '../services/search';
import showWhatsNew from '../services/whats-new';
import Suggestions from './Suggestions';
import getSettings from '../services/get-settings';

import type { ICategorizedSuggestion, ISuggestion } from '../types/suggestions.model';
import type { SuggestionClickEmitEvent } from '../types/custom-events.model';
import { ADD_TO_QUEUE, IS_INPUT_REGEX, KEY_COMBO, MODIFIER_KEYS, RESULTS_PER_CATEGORY } from '../constants';

interface LocalState {
   active: boolean;
   categorizedSuggestions: ICategorizedSuggestion[];
   selectedSuggestionUri: string;
}

export default class PowerBar extends React.Component<Record<string, unknown>, LocalState> {
   readonly isMac = Spicetify.Platform.PlatformData.os_name === 'osx';

   suggestions: ISuggestion[] = [];

   searchInput = React.createRef<HTMLInputElement>();

   previousSearchValue = '';

   _selectedSuggestionIndex = 0;

   settings: SettingsSection;

   set selectedSuggestionIndex(index: number) {
      if (index === -1) index = this.suggestions.length - 1;
      if (index === this.suggestions.length) index = 0;
      this._selectedSuggestionIndex = index;

      this.setState({ selectedSuggestionUri: this.suggestions[index].uri }, () => {
         const activeSuggestion = document.getElementsByClassName('suggestion-item__active')[0] as HTMLElement;
         const suggestionsElement = document.getElementById('power-bar-suggestions') as HTMLDivElement;
         scrollIntoViewIfNeeded(activeSuggestion, suggestionsElement);
      });
   }

   get selectedSuggestionIndex(): number {
      return this._selectedSuggestionIndex;
   }

   constructor(props: Record<string, unknown>) {
      super(props);

      this.state = {
         active: false,
         categorizedSuggestions: [],
         selectedSuggestionUri: '',
      };

      this.settings = getSettings(this);
      this.settings.pushSettings();

      showWhatsNew();
   }

   componentDidMount() {
      document.addEventListener('keydown', (e) => {
         if (!this.isActivationKeyCombo(e)) return;

         e.preventDefault();
         this.togglePowerBar();
      });
   }

   debouncedSearch = debounce(async () => {
      const limit: string = this.settings.getFieldValue(RESULTS_PER_CATEGORY);
      const { categorizedSuggestions, suggestions } = await search(this.searchInput.current?.value as string, limit);

      this.setState({ categorizedSuggestions });
      this.suggestions = suggestions;
      this.selectedSuggestionIndex = 0;
   }, 300);

   onSuggestionClick: SuggestionClickEmitEvent = (uri, e) => {
      this.onSelectSuggestion(uri, e);
   };

   async onSelectSuggestion(uri: string, { metaKey, ctrlKey }: KeyboardEvent | MouseEvent) {
      // Play item/add to queue if modifier key is held
      if (this.isMac && metaKey || !this.isMac && ctrlKey) {
         const addToQueue = this.settings.getFieldValue(ADD_TO_QUEUE);
         if (addToQueue) {
            await Spicetify.CosmosAsync.post(`https://api.spotify.com/v1/me/player/queue?uri=${uri}`);

            this.togglePowerBar();
            Spicetify.showNotification('Added to queue');
            return;
         }

         Spicetify.Player.playUri(uri);
         return;
      }

      navigateUsingUri(uri);
      this.togglePowerBar();
   }

   togglePowerBar() {
      this.setState((state) => ({ active: !state.active }));

      if (this.state.active && this.searchInput.current) {
         this.searchInput.current.focus();
         this.searchInput.current.value = '';
      } else {
         this.clearSuggestions();
      }
   }

   clearSuggestions() {
      this.setState({ categorizedSuggestions: [] });
      this.suggestions = [];
   }

   onInput: KeyboardEventHandler<HTMLInputElement> = (event) => {
      if (this.isActivationKeyCombo(event.nativeEvent)) return;

      const { currentTarget, key, shiftKey } = event;
      let trimmedValue = currentTarget.value.trim();
      if (IS_INPUT_REGEX.test(key)) trimmedValue = trimmedValue + key;

      // Clear input or hide power bar when esc is pressed
      if (key === 'Escape') {
         if (currentTarget.value) {
            currentTarget.value = '';
            this.clearSuggestions();
         } else {
            this.togglePowerBar();
         }
         return;
      }

      // Handle arrow keys
      if (key === 'ArrowUp') {
         event.preventDefault();
         this.selectedSuggestionIndex--;
         return;
      }
      if (key === 'ArrowDown') {
         event.preventDefault();
         this.selectedSuggestionIndex++;
         return;
      }

      if (key === 'Tab' && shiftKey) {
         // Todo document this shit
         event.preventDefault();

         const currentSuggestionType = this.suggestions[this.selectedSuggestionIndex].type;
         let nextSuggestionIndex: number | undefined = undefined;
         let i = this.selectedSuggestionIndex;

         while (!nextSuggestionIndex) {
            // Tab from first to last suggestion type
            if (i === -1) i = this.suggestions.length - 1; // Js array numbering..
            const suggestion = this.suggestions[i];

            if (suggestion.type !== currentSuggestionType) {
               // By default this gets the last suggestion of the different category type, so will need to jump to the first one.
               nextSuggestionIndex = i - (this.settings.getFieldValue<number>(RESULTS_PER_CATEGORY) - 1);
               break;
            }

            i--;
         }

         this.selectedSuggestionIndex = nextSuggestionIndex;

         return;
      }

      if (key === 'Tab') {
         event.preventDefault();

         const currentSuggestionType = this.suggestions[this.selectedSuggestionIndex].type;
         let nextSuggestionIndex = 0;

         for (let i = this.selectedSuggestionIndex; i < this.suggestions.length; i++) {
            const suggestion = this.suggestions[i];

            if (suggestion.type !== currentSuggestionType) {
               nextSuggestionIndex = i;
               break;
            }
         }

         this.selectedSuggestionIndex = nextSuggestionIndex;

         return;
      }

      if (key === 'Enter') {
         if (this.suggestions) {
            const suggestion = this.suggestions[this.selectedSuggestionIndex];
            this.onSelectSuggestion(suggestion.uri, event.nativeEvent);
            return;
         }
      }

      if (!trimmedValue || trimmedValue.length < 2) {
         this.clearSuggestions();
         return;
      }

      if (trimmedValue === this.previousSearchValue) return;

      this.previousSearchValue = trimmedValue;
      this.debouncedSearch();
   };

   handleSettingsInput: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const { code } = e.nativeEvent;
      const currentKeyCombo: string[] = this.settings.getFieldValue(KEY_COMBO);

      switch (code) {
         case 'Backspace': {
            this.settings.setFieldValue(KEY_COMBO, currentKeyCombo.slice(0, -1));
            e.currentTarget.value = e.currentTarget.value.split(',').slice(0, -1).join('');

            break;
         }
         case 'Enter':
         case 'Tab': {
            e.currentTarget.blur();
            break;
         }
         default: {
            if (currentKeyCombo.length >= 2) return;

            // Force the first key to be a modifier key
            const isModifier = MODIFIER_KEYS.some((modifierKey) => code.includes(modifierKey));
            if (currentKeyCombo.length === 0 && !isModifier) return;

            const keyToSave = currentKeyCombo.length === 0
            // Parse modifier keys to keyboard event modifier
            // E.g. code may contain 'AltLeft' which is parsed to 'altkey'. Extra replace needed for control key.
               ? code.toLowerCase().replace(/left|right/ig, 'Key').replace('control', 'ctrl')
               : code;

            this.settings.setFieldValue(KEY_COMBO, [...currentKeyCombo, keyToSave]);
            e.currentTarget.value = e.currentTarget.value ? `${e.currentTarget.value},${keyToSave}` : keyToSave;
         }
      }
   };

   isActivationKeyCombo(event: KeyboardEvent): boolean {
      const el = event.target as Element | null;
      // Prevent triggering the power bar in input fields. Such as search bar and settings page
      if (el?.tagName === 'INPUT' && el.id !== 'power-bar-search') return false;

      const [modifier, activationKey]: string[] = this.settings.getFieldValue(KEY_COMBO);

      return !!event[modifier as 'key'] && event.code === activationKey;
   }

   render() {
      return (
         <div id="power-bar-container" className={classnames({'hidden': !this.state.active})} onClick={this.togglePowerBar.bind(this)}>
            <div id="power-bar-wrapper" onClick={(e) => e.stopPropagation()}>
               <input
                  ref={this.searchInput}
                  type="text"
                  id="power-bar-search"
                  placeholder="Search Spotify"
                  className={classnames({ 'has-suggestions': this.state.categorizedSuggestions.length > 0 })}
                  onKeyDown={this.onInput}
               />
               {
                  this.state.categorizedSuggestions.length > 0 &&
                  <Suggestions
                     categorizedSuggestions={this.state.categorizedSuggestions}
                     selectedSuggestionUri={this.state.selectedSuggestionUri}
                     onSuggestionClick={this.onSuggestionClick}
                  />
               }
            </div>
         </div>
      );
   }
}
