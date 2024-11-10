import Folder from '../models/folder-model';
import BaseRepository from './base-repository';

class FolderRepository extends BaseRepository<Folder> {
  constructor(db) {
    super(db,'folders');
  }
}

export default FolderRepository;