export interface ICategorizedSuggestion {
    type: string,
    items: ISuggestion[]
}

export interface ISuggestion {
    album?: {
        album_type: string;
        artists: any[];
        available_markets: string[];
        external_urls: {spotify: string};
        href: string;
        id: string;
        images: ISpotifyImage[];
        name: string;
        release_date: string;
        release_date_precision: string;
        total_tracks: number;
        type: string;
        uri: string;
    }
    artists?: {
        external_urls: {spotify: string};
        href: string;
        id: string;
        name: string;
        type: string;
        uri: string;
    }[]
    owner?: {
        display_name: string;
        external_urls: {spotify: string};
        href: string;
        id: string;
        type: string;
        uri: string;
    }
    images?: ISpotifyImage[];
    available_markets: any[];
    disc_number: number;
    duration_ms: number;
    explicit: boolean;
    external_ids: {isrc: string};
    external_urls: {spotify: string};
    href: string;
    id: string;
    is_local: boolean;
    name: string;
    popularity: number;
    preview_url: string;
    track_number: number;
    type: string;
    uri: string;
}

export interface ISpotifyImage {
    height: number;
    url: string;
    width: number;
}
