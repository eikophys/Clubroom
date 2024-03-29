import { DocumentSnapshot } from 'firebase/firestore';
import { createContext } from 'react';
import { Group } from '../utils/group';
import { Member } from '../utils/member';

export type groupId = {
  isAdmin: boolean;
  setFrontMode: (e: boolean) => void | null;
  currentMember: DocumentSnapshot<Member> | null;
  updateCurrentMember: (e: DocumentSnapshot<Member>) => void;
  currentGroup: DocumentSnapshot<Group>;
};

export const GroupContext = createContext<Partial<groupId>>({});
