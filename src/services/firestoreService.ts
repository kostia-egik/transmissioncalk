// FIX: Update Firestore function calls to be compatible with the Firebase v8 API to maintain consistency with other Firebase services.
import firebase from 'firebase/compat/app';
import { db } from '../firebase';
import { Project, ProjectData } from '../types';

const getProjectsCollection = (userId: string) => {
    // FIX: Use the v8 API `db.collection()` instead of the v9 `collection()` function.
    return db.collection('users').doc(userId).collection('projects');
};

const getSharedProjectsCollection = () => {
    return db.collection('sharedProjects');
};

/**
 * Recursively removes properties with `undefined` values from an object.
 * Firestore does not support `undefined` and will throw an error.
 * @param obj The object to sanitize.
 * @returns A new object with `undefined` properties removed.
 */
const cleanUndefined = (obj: any): any => {
    if (obj === null || obj === undefined) {
        return null; // Firestore can handle null
    }

    if (Array.isArray(obj)) {
        return obj.map(v => cleanUndefined(v));
    }

    if (typeof obj === 'object' && obj.constructor === Object) {
        const newObj: { [key: string]: any } = {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                const value = obj[key];
                if (value !== undefined) {
                    newObj[key] = cleanUndefined(value);
                }
            }
        }
        return newObj;
    }

    return obj;
};


/**
 * Сохраняет или обновляет проект в облаке Firestore.
 * @param userId ID пользователя Firebase.
 * @param project Объект проекта для сохранения.
 */
export const saveProjectToCloud = async (userId: string, project: Project): Promise<void> => {
    // Удаляем временные UI-флаги перед сохранением
    const { isLocal, isCloud, ...projectToSave } = project;
    
    // Sanitize the object to remove undefined values
    const sanitizedProject = cleanUndefined(projectToSave);

    // FIX: Use the v8 API `doc().set()` instead of `setDoc()`.
    const projectDoc = getProjectsCollection(userId).doc(project.id);
    await projectDoc.set(sanitizedProject);
};

/**
 * Получает все проекты пользователя из облака.
 * @param userId ID пользователя Firebase.
 * @returns Массив проектов.
 */
export const getProjectsFromCloud = async (userId: string): Promise<Project[]> => {
    const projectsCollection = getProjectsCollection(userId);
    // FIX: Use the v8 API for querying and ordering documents.
    const q = projectsCollection.orderBy('lastModified', 'desc');
    const querySnapshot = await q.get();
    const projects: Project[] = [];
    querySnapshot.forEach((doc) => {
        projects.push(doc.data() as Project);
    });
    return projects;
};

/**
 * Удаляет проект из облака.
 * @param userId ID пользователя Firebase.
 * @param projectId ID проекта для удаления.
 */
export const deleteProjectFromCloud = async (userId: string, projectId: string): Promise<void> => {
    // FIX: Use the v8 API `doc().delete()` to remove a document.
    const projectDoc = getProjectsCollection(userId).doc(projectId);
    await projectDoc.delete();
};

/**
 * Получает один проект из облака по его ID.
 * @param userId ID пользователя Firebase.
 * @param projectId ID проекта для получения.
 * @returns Объект проекта или undefined, если не найден.
 */
export const getProjectFromCloud = async (userId: string, projectId: string): Promise<Project | undefined> => {
    // FIX: Use the v8 API `doc().get()` to retrieve a document.
    const projectDocRef = getProjectsCollection(userId).doc(projectId);
    const docSnap = await projectDocRef.get();
    
    // FIX: Changed docSnap.exists() to docSnap.exists. In the Firebase v8 compat API, .exists is a boolean property, not a function.
    if (docSnap.exists) {
        return docSnap.data() as Project;
    } else {
        return undefined;
    }
};

/**
 * Creates a public, shareable copy of a project.
 * @param projectData The data of the project to share.
 * @returns The ID of the newly created shared project document.
 */
export const addSharedProject = async (projectData: ProjectData): Promise<string> => {
    const sanitizedData = cleanUndefined(projectData);
    const sharedProject = {
        ...sanitizedData,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    };
    const docRef = await getSharedProjectsCollection().add(sharedProject);
    return docRef.id;
};

/**
 * Retrieves a shared project by its ID.
 * @param projectId The ID of the shared project.
 * @returns The project data or undefined if not found.
 */
export const getSharedProject = async (projectId: string): Promise<ProjectData | undefined> => {
    const docRef = getSharedProjectsCollection().doc(projectId);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
        // We only need ProjectData, not the createdAt timestamp
        const { createdAt, ...projectData } = docSnap.data() as any;
        return projectData as ProjectData;
    } else {
        return undefined;
    }
};