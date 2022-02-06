export default function navigateUsingUri(uri: string) {
    const href = Spicetify.URI.from(uri)!.toURLPath(true);
    Spicetify.Platform.History.push(href);
}
