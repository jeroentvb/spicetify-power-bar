import { SettingsSection } from 'spcr-settings';
import { ADD_TO_QUEUE, KEY_COMBO, MODIFIER_KEYS, RESULTS_PER_CATEGORY } from '../constants';

export function getSettings(isMac: boolean) {
   const Settings = new SettingsSection('Power bar', 'power-bar-settings', {
      [RESULTS_PER_CATEGORY]: {
         type: 'dropdown',
         description: 'Show amount of suggestions per category',
         defaultValue: '3',
         options: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
      },
      [KEY_COMBO]: {
         type: 'input',
         description: 'Activation key combo. First key needs to be a modifier (shift, ctrl, alt or cmd/windows key).',
         defaultValue: [isMac ? 'altKey' : 'ctrlKey', 'Space'],
         events: {
            onKeyDown: handleSettingsInput,
            onBlur: handleKeyComboInputError,
         }
      },
      [ADD_TO_QUEUE]: {
         type: 'toggle',
         description: 'Add suggestion to queue instead of playing it when holding ctrl (windows/linux) or cmd (mac)',
         defaultValue: false,
      },
   });

   function handleSettingsInput(e: React.KeyboardEvent<HTMLInputElement>) {
      e.preventDefault();
      e.stopPropagation();
      const { code } = e.nativeEvent;
      const currentKeyCombo: string[] = Settings.getFieldValue(KEY_COMBO);

      switch (code) {
         case 'Backspace': {
            Settings.setFieldValue(KEY_COMBO, currentKeyCombo.slice(0, -1));
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

            Settings.setFieldValue(KEY_COMBO, [...currentKeyCombo, keyToSave]);
            e.currentTarget.value = e.currentTarget.value ? `${e.currentTarget.value},${keyToSave}` : keyToSave;
         }
      }
   }

   function handleKeyComboInputError(e: React.FocusEvent<HTMLInputElement, Element>) {
      const currentKeyCombo: string[] = Settings.getFieldValue(KEY_COMBO);
      if (currentKeyCombo.length === 0) {
         e.currentTarget.placeholder = 'Please set a valid key combo';
         Spicetify.showNotification('Please set a valid key combo for the power bar');
      }
   }

   return Settings;
}
