import { ButtonGroup } from '@chakra-ui/button';
import { useBoolean, useDisclosure } from '@chakra-ui/hooks';
import { Input } from '@chakra-ui/input';
import { Box, Heading, HStack, Stack, VStack, Spacer } from '@chakra-ui/layout';
import { Skeleton } from '@chakra-ui/skeleton';
import { Select } from '@chakra-ui/select';
import { Alert, AlertIcon, AlertTitle } from '@chakra-ui/alert';
import { FormControl, FormLabel } from '@chakra-ui/form-control';
import { useToast } from '@chakra-ui/toast';
import { QueryDocumentSnapshot } from '@firebase/firestore';
import React, { Suspense, useContext, useState } from 'react';
import { IoAdd } from 'react-icons/io5';
import { GroupContext } from '../contexts/group';
import { createTag, listTag, tag, tagColors } from '../utils/group-tag';
import { GroupTag, LoadingScreen } from './assets';
import { useUniversalColors } from '../hooks/color-mode';
import { BasicButton, CancelButton } from './buttons';
import { Modal, ModalContent, ModalOverlay } from '@chakra-ui/modal';
import useSWR from 'swr';
import { firestoreFetcher } from '../utils/swr-fetcher';

const CreateTag = () => {
  const [createMode, setCreateMode] = useBoolean(false);
  const [tagName, setTagName] = useState('');
  const [tagColor, setTagColor] = useState<tagColors>('red');
  const { currentGroup } = useContext(GroupContext);
  const toast = useToast();
  const tagColors: tagColors[] = [
    'gray',
    'red',
    'orange',
    'yellow',
    'green',
    'blue',
    'cyan',
    'purple',
    'pink',
  ];
  const bgColor = useUniversalColors().background;
  return (
    <HStack my="3" position="relative" zIndex={100} w="max-content">
      {createMode ? (
        <VStack
          position="absolute"
          p="4"
          bgColor={bgColor}
          rounded="md"
          shadow="md"
        >
          <form
            onSubmit={() => {
              if (currentGroup && tagName.length > 0)
                createTag(new tag(tagName, tagColor), currentGroup.id)
                  .then(() => {
                    toast({
                      title: 'タグを作成しました',
                      status: 'success',
                    });
                    setCreateMode.off();
                  })
                  .catch(() => {
                    toast({ title: '作成に失敗しました', status: 'error' });
                  });
            }}
          >
            <HStack w="max-content">
              <FormControl isRequired>
                <FormLabel htmlFor="tagName">タグの名前</FormLabel>
                <Input
                  id="tagName"
                  onChange={(e) => setTagName(e.target.value)}
                />
              </FormControl>
              <FormControl>
                <FormLabel htmlFor="tagColor">タグのカラー</FormLabel>
                <Select
                  id="tagColor"
                  variant="filled"
                  size="sm"
                  w="max-content"
                  iconColor={tagColor}
                  value={tagColor}
                  onChange={(e) => setTagColor(e.target.value as tagColors)}
                >
                  {tagColors.map((color) => (
                    <option key={color} id={color}>
                      {color}
                    </option>
                  ))}
                </Select>
              </FormControl>
            </HStack>
            <Spacer />

            <ButtonGroup>
              <BasicButton
                variant="primary"
                disabled={tagName.length == 0 && tagName.length < 20}
                type="submit"
              >
                作成
              </BasicButton>
              <CancelButton
                variant="secondary"
                colorScheme="red"
                onClick={setCreateMode.off}
              >
                キャンセル
              </CancelButton>
            </ButtonGroup>
          </form>
        </VStack>
      ) : (
        <BasicButton
          leftIcon={<IoAdd />}
          variant="secondary"
          size="sm"
          onClick={setCreateMode.on}
        >
          タグを作成
        </BasicButton>
      )}
    </HStack>
  );
};
export const TagSetting = (): JSX.Element => {
  return (
    <Box>
      <Heading size="lg">タグ</Heading>
      <HStack>
        <CreateTag />
        <TagList />
      </HStack>
    </Box>
  );
};

const Tag: React.FC<{
  tag: QueryDocumentSnapshot<tag>;
  onUpdate: () => unknown;
}> = ({ tag, onUpdate }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const TagSettingModal = React.lazy(() => import('./TagSettingModal'));
  return (
    <>
      <GroupTag tag={tag} onClick={onOpen} />
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <Suspense fallback={<LoadingScreen />}>
            <TagSettingModal
              tag={tag}
              onUpdate={() => {
                onClose();
                onUpdate();
              }}
            />
          </Suspense>
        </ModalContent>
      </Modal>
    </>
  );
};
const TagList = () => {
  const { currentGroup } = useContext(GroupContext);
  // ToDo: 無限スクロールを実装
  const { data, error, mutate } = useSWR<QueryDocumentSnapshot<tag>[]>(
    [listTag, currentGroup?.id],
    firestoreFetcher
  );
  return (
    <Skeleton isLoaded={!!data}>
      {data?.length != 0 ? (
        <Stack shouldWrapChildren direction="row">
          {data?.map((e) => (
            <Tag tag={e} key={e.id} onUpdate={mutate} />
          ))}
        </Stack>
      ) : (
        <Alert status="info">
          <AlertIcon />
          <AlertTitle>タグがありません</AlertTitle>
        </Alert>
      )}
      {error && (
        <Alert status="error">
          <AlertIcon />
          エラーが発生しました
        </Alert>
      )}
    </Skeleton>
  );
};
