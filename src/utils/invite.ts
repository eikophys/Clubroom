import {
  deleteDoc,
  doc,
  DocumentData,
  DocumentReference,
  DocumentSnapshot,
  FirestoreDataConverter,
  getDoc,
  QueryDocumentSnapshot,
  setDoc,
  SnapshotOptions,
  Timestamp,
} from '@firebase/firestore';
import { Db } from './firebase';
import { Group } from './group';

export type Invite = {
  authorId: string;
  group: DocumentReference<Group>[];
  used: Timestamp | false;
};

const inviteDataConverter: FirestoreDataConverter<Invite> = {
  toFirestore(invite: Invite): DocumentData {
    return invite;
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    option: SnapshotOptions
  ): Invite {
    const data = snapshot.data(option);
    return {
      authorId: data.authorId,
      group: data.group,
      used: data.used,
    };
  },
};

export const createInvite = async (
  email: string,
  invite: Invite
): Promise<void> => {
  try {
    return setDoc(doc(Db(), `invite/${email}`), invite);
  } catch (error) {
    console.error(error);
    throw new Error();
  }
};

export const getInvite = async (
  email: string
): Promise<DocumentSnapshot<Invite>> => {
  try {
    return await getDoc(
      doc(Db(), `invite/${email}`).withConverter(inviteDataConverter)
    );
  } catch (error) {
    console.error(error);
    throw new Error();
  }
};

export const deleteInvite = async (
  invite: DocumentReference<Invite>
): Promise<void> => {
  try {
    await deleteDoc(invite);
  } catch (error) {
    console.error(error);
    throw new Error();
  }
};
