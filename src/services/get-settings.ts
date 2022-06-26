import { SettingsSection } from 'spcr-settings';
import PowerBar from '../components/PowerBar';
import { ADD_TO_QUEUE, KEY_COMBO, RESULTS_PER_CATEGORY } from '../constants';

export default function getSettings(powerBar: PowerBar) {
   return new SettingsSection('Power bar', 'power-bar-settings', {
      [RESULTS_PER_CATEGORY]: {
         type: 'dropdown',
         description: 'Show amount of suggestions per category',
         defaultValue: '3',
         options: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
      },
      [KEY_COMBO]: {
         type: 'input',
         description: 'Activation key combo. First key needs to be a modifier (shift, ctrl, alt or cmd/windows key).',
         defaultValue: [powerBar.isMac ? 'altKey' : 'ctrlKey', 'Space'],
         events: {
            onKeyDown: powerBar.handleSettingsInput,
            onBlur: (e) => {
               const currentKeyCombo: string[] = powerBar.settings.getFieldValue(KEY_COMBO);
               if (currentKeyCombo.length === 0) {
                  e.currentTarget.placeholder = 'Please set a valid key combo';
                  Spicetify.showNotification('Please set a valid key combo for the power bar');
               }
            }
         }
      },
      [ADD_TO_QUEUE]: {
         type: 'toggle',
         description: 'Add suggestion to queue instead of playing it when holding ctrl (windows/linux) or cmd (mac)',
         defaultValue: false,
      },
   });
}
