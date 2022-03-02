import React from 'react';
import ReactMarkdown from 'react-markdown';
import whatsNew from 'spcr-whats-new';
import { version } from '../../package.json';
import CHANGE_NOTES from '../constants/change-notes';

export default function showWhatsNew() {
   const markdown = (
      // eslint-disable-next-line react/no-children-prop
      <ReactMarkdown children={CHANGE_NOTES} />
   );

   whatsNew(
      'power-bar',
      version,
      {
         title: `New in Power Bar v${version}`,
         content: markdown,
         isLarge: true,
      }
   );
}
