import type { Album, Artist, Playlist, Track } from './search-modal-results.model';

export type ICategorizedSuggestions = TrackSuggestions | ArtistSuggestions | AlbumSuggestions | PlaylistSuggestions;

export type ISuggestion = ICategorizedSuggestions['items'][number];

export interface TrackSuggestions {
   type: 'tracks',
   items: Track[]
}

interface ArtistSuggestions {
   type: 'artists',
   items: Artist[]
}

interface AlbumSuggestions {
   type: 'albums',
   items: Album[]
}

interface PlaylistSuggestions {
   type: 'playlists',
   items: Playlist[]
}

export interface ISearchReturnType {
    categorizedSuggestions: ICategorizedSuggestions[],
    suggestions: ISuggestion[]
}
