/**
 * Models for the search modal results from Spotify's GraphQL API.
 * @note this file is AI generated based on the response data.
 */
export interface SearchResponse {
    data: {
        searchV2: {
            topResultsV2: {
                itemsV2: ItemV2[];
            };
        };
    };
    extensions?: Extensions;
}

export interface ItemV2 {
    item: ResponseWrapper;
    matchedFields: unknown[]; // kept generic — can be refined if you have a schema
}

export type ResponseWrapper =
    | { __typename: 'ArtistResponseWrapper'; data: Artist }
    | { __typename: 'PlaylistResponseWrapper'; data: Playlist }
    | { __typename: 'AlbumResponseWrapper'; data: Album }
    | { __typename: 'TrackResponseWrapper'; data: Track };

export interface Artist {
    __typename: 'Artist';
    profile: {
        name: string;
    };
    uri: string;
    visuals?: Visuals;
}

export interface Playlist {
    __typename: 'Playlist';
    description?: string;
    images?: {
        items: ImageItem[];
    };
    name: string;
    ownerV2?: {
        data: {
            __typename?: 'User';
            name: string;
        };
    };
    uri: string;
}

export interface Album {
    __typename: 'Album';
    artists: {
        items: { profile: { name: string } }[];
    };
    coverArt?: ImageWithColors;
    name: string;
    uri: string;
}

export interface Track {
    __typename: 'Track';
    albumOfTrack?: {
        coverArt?: ImageWithColors;
    };
    artists?: {
        items: { profile: { name: string } }[];
    };
    name: string;
    uri: string;
}

export interface Visuals {
    avatarImage?: ImageWithColors;
}

export interface ImageWithColors {
    extractedColors?: {
        colorDark?: ColorInfo;
        [key: string]: ColorInfo | undefined;
    };
    sources: Source[];
}

export interface ImageItem {
    extractedColors?: {
        colorDark?: ColorInfo;
        [key: string]: ColorInfo | undefined;
    };
    sources: Source[];
}

export interface ColorInfo {
    hex: string;
    isFallback: boolean;
}

export interface Source {
    height: number | null;
    width: number | null;
    url: string;
}

export interface Extensions {
    requestIds?: {
        [path: string]: {
            [service: string]: string;
        };
    };
}