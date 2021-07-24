import {
  Button,
  FormControl,
  FormLabel,
  Heading,
  Input,
  useBoolean,
} from '@chakra-ui/react';
import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../contexts/user';
import { setUser } from '../utils/user';
import { firebase } from '../utils/firebase';

type Props = {
  name: string | null;
  id: string;
};

const NewAccount: React.FC<Props> = ({ name, id }) => {
  const localAuthContext = useContext(AuthContext);
  const [input, updateInput] = useState<string>('');
  useEffect(() => {
    if (name) {
      updateInput(name);
    }
  }, [name]);
  const [isSubmitting, setIsSubmitting] = useBoolean(false);
  console.info(name, id);
  async function applyUserName(setName: string, id: string): Promise<void> {
    console.info(setName);
    if (!(setName.length > 0)) {
      return;
    }
    setIsSubmitting.on();
    try {
      await setUser(
        {
          name: setName,
          updated: firebase.firestore.FieldValue.serverTimestamp(),
        },
        id
      ).then(() => {
        if (localAuthContext.accountEnablement.update) {
          localAuthContext.accountEnablement.update(true);
        }
      });
      setIsSubmitting.off();
    } catch (error) {
      console.error(error);
      setIsSubmitting.off();
    }
  }
  return (
    <>
      <Heading>アカウント登録</Heading>
      <FormControl>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            applyUserName(input, id);
          }}>
          <FormLabel>名前</FormLabel>
          <Input
            defaultValue={name ?? ''}
            autoFocus
            onChange={(e) => {
              updateInput(e.target.value);
            }}
          />
          <Button type="submit" isLoading={isSubmitting}>
            登録
          </Button>
        </form>
      </FormControl>
    </>
  );
};

export default NewAccount;