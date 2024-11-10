import Image from '../models/image-model';
import BaseRepository from './base-repository';

class ImageRepository extends BaseRepository<Image> {
  constructor(db) {
    super(db,'images');
  }
}

export default ImageRepository;