export default function navigateUsingUri(uri: string) {
   const href = Spicetify.URI.from(uri)?.toURLPath(true);
   if (href) Spicetify.Platform.History.push(href);
}
