import { Files } from 'files-sdk';
import { neon } from 'files-sdk/neon';

const files = new Files({ adapter: neon({ bucket: 'service-photos' }) });

export async function uploadPhoto(key: string, file: File) {
  await files.upload(key, new Uint8Array(await file.arrayBuffer()), {
    contentType: file.type,
  });
}

export async function deletePhoto(key: string) {
  await files.delete(key);
}

export async function signPhotos<T extends { path: string; url?: string }>(photos: T[]) {
  return Promise.all(
    photos.map(async (photo) => ({
      ...photo,
      url: await files.url(photo.path, { expiresIn: 120 }),
    })),
  );
}
