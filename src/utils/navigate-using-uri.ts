export default function navigateUsingUri(uri: string) {
   const href = Spicetify.URI.fromString(uri)?.toURLPath(true);
   if (href) Spicetify.Platform.History.push(href);
}
