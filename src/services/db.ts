import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Project } from '../types';

const DB_NAME = 'transmission-projects-db';
const STORE_NAME = 'projects';
const DB_VERSION = 1;

interface ProjectDB extends DBSchema {
  [STORE_NAME]: {
    key: string;
    value: Project;
    indexes: { 'lastModified': number };
  };
}

const dbPromise = openDB<ProjectDB>(DB_NAME, DB_VERSION, {
  upgrade(db: IDBPDatabase<ProjectDB>) {
    const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
    store.createIndex('lastModified', 'lastModified');
  },
});

export const saveProject = async (project: Project): Promise<void> => {
  const db = await dbPromise;
  await db.put(STORE_NAME, project);
};

export const getAllProjects = async (): Promise<Project[]> => {
  const db = await dbPromise;
  // Сортировка по убыванию даты изменения
  return db.getAllFromIndex(STORE_NAME, 'lastModified').then((projects: Project[]) => projects.reverse());
};

export const getProject = async (id: string): Promise<Project | undefined> => {
  const db = await dbPromise;
  return db.get(STORE_NAME, id);
};

export const deleteProject = async (id: string): Promise<void> => {
  const db = await dbPromise;
  await db.delete(STORE_NAME, id);
};