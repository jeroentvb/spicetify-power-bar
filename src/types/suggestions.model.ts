export type ICategorizedSuggestions = TrackSuggestions | ArtistSuggestions | AlbumSuggestions | PlaylistSuggestions;

export type ISuggestion = ICategorizedSuggestions['items'][number];

export interface TrackSuggestions {
   type: 'tracks',
   items: SpotifyApi.TrackObjectFull[]
}

interface ArtistSuggestions {
   type: 'artists',
   items: SpotifyApi.ArtistObjectFull[]
}

interface AlbumSuggestions {
   type: 'albums',
   items: SpotifyApi.AlbumObjectSimplified[]
}

interface PlaylistSuggestions {
   type: 'playlists',
   items: SpotifyApi.PlaylistObjectSimplified[]
}

export interface ISearchReturnType {
    categorizedSuggestions: ICategorizedSuggestions[],
    suggestions: ISuggestion[]
}
