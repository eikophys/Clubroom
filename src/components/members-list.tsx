import { Box, Grid, GridItem, HStack, Spacer, VStack } from '@chakra-ui/layout';
import React, {
  useContext,
  useState,
  useEffect,
  ReactElement,
  useMemo,
  useCallback,
  SetStateAction,
  Dispatch,
} from 'react';
import { IoAdd, IoAnalytics, IoPricetag, IoTrash } from 'react-icons/io5';
import { GroupContext } from '../contexts/group';
import { Link as RouterLink } from 'react-router-dom';
import {
  DocumentReference,
  DocumentSnapshot,
  getDoc,
  QueryDocumentSnapshot,
} from '@firebase/firestore';
import { GroupTag, LoadMoreButton, MemberAvatar } from './assets';
import { listTag, tag } from '../utils/group-tag';
import {
  deleteMember,
  listMembers,
  Member,
  setMember,
  setMemberTag,
} from '../utils/member';
import { GroupTagList } from './group-tag-control';
import Card, { cardWidth } from './createCard';
import { BasicButton } from './buttons';
import { useToast } from '@chakra-ui/toast';
import { Editable, EditableInput, EditablePreview } from '@chakra-ui/editable';
import {
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
} from '@chakra-ui/popover';
import { Skeleton } from '@chakra-ui/skeleton';
import { Tr, Td, Table, Thead, Th, Tbody } from '@chakra-ui/table';
import { Button, ButtonGroup, IconButton } from '@chakra-ui/button';
import { Tooltip } from '@chakra-ui/tooltip';
import { Text } from '@chakra-ui/layout';
import { Switch } from '@chakra-ui/switch';
import { Alert, AlertIcon } from '@chakra-ui/alert';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from '@chakra-ui/tabs';
import { Menu, MenuButton, MenuItem, MenuList } from '@chakra-ui/menu';

const MemberName: React.FC<{ data: QueryDocumentSnapshot<Member> }> = ({
  data,
}) => {
  const { currentGroup } = useContext(GroupContext);
  const toast = useToast();
  return (
    <Editable
      defaultValue={data.data().name}
      onSubmit={(e) => {
        const _member = data.data();
        _member.name = e;
        if (currentGroup)
          setMember(_member, data.id, currentGroup.id, { merge: true }).catch(
            () =>
              toast({
                title: '保存に失敗しました',
                status: 'error',
              })
          );
      }}
    >
      <EditablePreview />
      <EditableInput />
    </Editable>
  );
};

const MemberTags: React.FC<{ memberId: string; memberData: Member }> = ({
  memberId,
  memberData,
}) => {
  // ユーザーが持つタグ
  const [userTags, setUserTags] = useState<DocumentSnapshot<tag>[]>([]);
  const { currentGroup, isAdmin } = useContext(GroupContext);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  const addTag = useCallback(
    (tag: DocumentSnapshot<tag>) => {
      setUserTags((e) => {
        const newMemberTag = [...e, tag];
        const newMemberTagRef: DocumentReference<tag>[] = newMemberTag.map(
          (e) => e.ref
        );
        if (currentGroup) {
          setMemberTag(newMemberTagRef, memberId, currentGroup.id);
        }
        return newMemberTag;
      });
    },
    [currentGroup, memberId]
  );

  const removeTag = useCallback(
    (tag: DocumentSnapshot<tag>) => {
      const removeTagIndex = userTags.findIndex((e) => e.id === tag.id);
      const newTags = [
        ...userTags.slice(0, removeTagIndex),
        ...userTags.slice(removeTagIndex + 1),
      ];
      const newTagsRef = newTags.map((e) => e.ref);
      if (currentGroup) {
        setMemberTag(newTagsRef, memberId, currentGroup.id);
      }
      setUserTags(newTags);
    },
    [currentGroup, memberId, userTags]
  );

  useEffect(() => {
    const tagSnapshots: DocumentSnapshot<tag>[] = [];
    Promise.all(
      memberData.tag.map(
        (tagRef): Promise<void> =>
          getDoc(tagRef).then((e) => {
            if (e.exists()) {
              tagSnapshots.push(e);
            } else {
              removeTag(e);
            }
          })
      )
    ).then(() => {
      setUserTags(tagSnapshots);
      setIsLoaded(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  //  タグを追加するボタン（popover）
  const AddTagButton: React.FC = () => {
    return (
      <Popover isLazy lazyBehavior="keepMounted">
        <PopoverTrigger>
          <Box>
            <BasicButton leftIcon={<IoAdd />} variant="secondary" size="xs">
              タグを追加
            </BasicButton>
          </Box>
        </PopoverTrigger>
        <PopoverContent w="max-content">
          <PopoverArrow />
          <PopoverCloseButton />
          <PopoverHeader>タグを選択</PopoverHeader>
          <PopoverBody>
            <GroupTagList
              userTags={{
                ids: userTags.map((e) => e.id),
                addTag: addTag,
                removeTag: removeTag,
              }}
            />
          </PopoverBody>
        </PopoverContent>
      </Popover>
    );
  };

  return (
    <HStack>
      <Skeleton isLoaded={isLoaded}>
        <Grid gap="3" gridTemplateRows="1fr" gridAutoFlow="column">
          {userTags.map((tag) => (
            <GridItem key={tag.id}>
              <GroupTag
                tag={tag}
                onRemove={isAdmin ? () => removeTag(tag) : undefined}
                size="sm"
              />
            </GridItem>
          ))}
        </Grid>
      </Skeleton>
      {isAdmin && <AddTagButton />}
    </HStack>
  );
};

const MemberRow: React.FC<{
  data: QueryDocumentSnapshot<Member>;
  buttons: ReactElement;
  isSimple?: boolean;
}> = ({ data, buttons, isSimple = false }) => (
  <>
    {data.data() && (
      <Tr>
        <Td>
          <HStack>
            <MemberAvatar member={data.data()} status={true} />
            <MemberName data={data} />
          </HStack>
        </Td>
        {!isSimple && (
          <>
            <Td>
              <HStack>{buttons}</HStack>
            </Td>
            <Td>
              <MemberTags memberId={data.id} memberData={data.data()} />
            </Td>
          </>
        )}
      </Tr>
    )}
  </>
);

const MembersListTable: React.FC<{
  membersData: QueryDocumentSnapshot<Member>[];
  isSimple?: boolean;
}> = ({ membersData, isSimple = false }) => {
  const { currentMember, isAdmin } = useContext(GroupContext);
  return useMemo(
    () => (
      <>
        {membersData?.map((member) => (
          <MemberRow
            key={member.id}
            data={member}
            isSimple={isSimple}
            buttons={
              <ButtonGroup colorScheme="gray" variant="ghost" spacing="1">
                <Tooltip label="アクティビティーを見る">
                  <IconButton
                    aria-label="アクティビティーを見る"
                    icon={<IoAnalytics />}
                    as={RouterLink}
                    to={`/member/${member.id}`}
                  />
                </Tooltip>
                {currentMember?.id !== member.id && isAdmin && (
                  <Tooltip label="メンバーの削除">
                    <IconButton
                      aria-label="メンバーの削除"
                      icon={<IoTrash />}
                      onClick={() => deleteMember(member.ref)}
                    />
                  </Tooltip>
                )}
              </ButtonGroup>
            }
          />
        ))}
      </>
    ),
    [currentMember?.id, isAdmin, isSimple, membersData]
  );
};

const MembersListCard: React.FC<{
  membersData: QueryDocumentSnapshot<Member>[];
}> = ({ membersData }) => {
  const { currentGroup } = useContext(GroupContext);
  return (
    <Grid
      templateColumns={`repeat( auto-fit, minmax(${cardWidth}mm, 1fr))`}
      gap="4"
    >
      {currentGroup &&
        membersData.map((member) => (
          <Card
            key={member.id}
            member={{ data: member.data(), id: member.id }}
            group={currentGroup}
          />
        ))}
    </Grid>
  );
};

const loadMembersList = async (props: {
  groupId: string;
  count: number;
  sortWithOnline?: boolean;
  startFrom?: QueryDocumentSnapshot<Member>;
  filter?: DocumentReference<tag>;
}): Promise<QueryDocumentSnapshot<Member>[]> => {
  return listMembers(
    props.groupId,
    props.count,
    undefined,
    props.sortWithOnline ? 'active' : undefined,
    props.startFrom,
    props.filter
  ).then((members) => {
    const membersList: QueryDocumentSnapshot<Member>[] = [];
    members?.forEach((_) => membersList.push(_));
    return membersList;
  });
};

const MembersList: React.FC<{
  onlyOnline?: boolean;
  isSimple?: boolean;
}> = ({ onlyOnline = false, isSimple = false }) => {
  const loadDataCount = 10;
  const { currentGroup, isAdmin } = useContext(GroupContext);
  const [sortWithOnline, setSortWithOnline] = useState<boolean>();
  const [shownMembers, setShownMembers] = useState<
    QueryDocumentSnapshot<Member>[]
  >([]);
  const [filterState, setFilterState] =
    useState<null | QueryDocumentSnapshot<tag>>(null);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<Member>>();

  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  const loadMoreData = useCallback(() => {
    if (currentGroup)
      loadMembersList({
        groupId: currentGroup.id,
        count: loadDataCount,
        sortWithOnline: sortWithOnline,
        startFrom: lastDoc ?? undefined,
        filter: filterState?.ref ?? undefined,
      }).then((membersList) => {
        setLastDoc(membersList[loadDataCount - 1] ?? null);
        setShownMembers((e) => [...e, ...membersList]);
      });
  }, [currentGroup, filterState, lastDoc, sortWithOnline]);

  useEffect(
    () => setSortWithOnline(onlyOnline),
    [onlyOnline, setSortWithOnline]
  );

  useEffect(() => {
    if (currentGroup)
      loadMembersList({
        groupId: currentGroup.id,
        count: loadDataCount,
        sortWithOnline: sortWithOnline,
        filter: filterState?.ref ?? undefined,
      }).then((e) => {
        setShownMembers(e);
        setLastDoc(e[loadDataCount - 1]);
        setIsLoaded(true);
      });
  }, [currentGroup, filterState, sortWithOnline]);

  const MemoedMemberFilter = () =>
    useMemo(
      () => (
        <Menu isLazy>
          <MenuButton as={Button} leftIcon={<IoPricetag />}>
            {filterState == null
              ? '絞り込みなし'
              : `${filterState.data().name}で絞り込み`}
          </MenuButton>
          <MenuList>
            <MemberFilter filter={setFilterState} />
          </MenuList>
        </Menu>
      ),
      []
    );

  // eslint-disable-next-line react/display-name
  const LoadMore = React.memo(() => <LoadMoreButton loadMore={loadMoreData} />);
  return (
    <>
      {!onlyOnline && (
        <HStack spacing="2" p="1" my="2" w="full">
          <Text>進行中のみ表示</Text>
          <Switch
            isChecked={sortWithOnline}
            onChange={() => {
              setSortWithOnline(!sortWithOnline);
            }}
            colorScheme="green"
          />
          <Spacer />
          <MemoedMemberFilter />
        </HStack>
      )}
      {shownMembers?.length == 0 && isLoaded ? (
        <Alert>
          <AlertIcon />
          {sortWithOnline
            ? 'オンラインのメンバーがいません'
            : '表示するメンバーがいません'}
        </Alert>
      ) : (
        <Skeleton isLoaded={isLoaded} w="full" h="4xl" minH="max-content">
          <Tabs
            variant="soft-rounded"
            colorScheme="gray"
            isLazy
            lazyBehavior="keepMounted"
          >
            {!isSimple && isAdmin && (
              <TabList>
                <Tab>表</Tab>
                <Tab>カード</Tab>
              </TabList>
            )}
            <TabPanels>
              <TabPanel>
                <VStack spacing="4">
                  <Table
                    colorScheme="blackAlpha"
                    size={isSimple ? 'sm' : 'md'}
                    w="full"
                  >
                    {!isSimple && (
                      <Thead>
                        <Tr>
                          <Th>名前</Th>
                          <Th></Th>
                          <Th>タグ</Th>
                        </Tr>
                      </Thead>
                    )}
                    <Tbody>
                      {shownMembers && (
                        <MembersListTable
                          membersData={shownMembers}
                          isSimple={isSimple}
                        />
                      )}
                    </Tbody>
                  </Table>
                </VStack>
              </TabPanel>
              <TabPanel>
                {shownMembers && <MembersListCard membersData={shownMembers} />}
              </TabPanel>
            </TabPanels>
          </Tabs>
          {lastDoc && <LoadMore />}
        </Skeleton>
      )}
    </>
  );
};

const MemberFilter = ({
  filter,
}: {
  filter: Dispatch<SetStateAction<QueryDocumentSnapshot<tag> | null>>;
}) => {
  const [groupTags, setGroupTags] = useState<QueryDocumentSnapshot<tag>[]>([]);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const { currentGroup } = useContext(GroupContext);
  useEffect(() => {
    if (currentGroup) {
      listTag(currentGroup.id).then((e) => {
        e.forEach((f) => {
          setGroupTags((oldTags) => [...oldTags, f]);
        });
        setIsLoaded(true);
      });
    }
  }, [currentGroup]);

  const setFilter = filter;

  return (
    <Skeleton isLoaded={isLoaded}>
      {groupTags.length == 0 ? (
        <Alert status="info">
          <AlertIcon />
          タグがありません
        </Alert>
      ) : (
        <>
          <MenuItem value="default" onClick={() => setFilter(null)}>
            絞り込みなし
          </MenuItem>
          {groupTags.map((e) => (
            <MenuItem
              key={e.id}
              value={e.id}
              onClick={() =>
                setFilter(groupTags.find((tag) => tag.id == e.id) ?? null)
              }
              icon={<IoPricetag />}
            >
              {e.data().name}
            </MenuItem>
          ))}
        </>
      )}
    </Skeleton>
  );
};

export default MembersList;
