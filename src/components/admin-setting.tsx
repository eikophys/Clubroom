import { ButtonGroup } from '@chakra-ui/button';
import { useBoolean } from '@chakra-ui/hooks';
import { Input } from '@chakra-ui/input';
import {
  Box,
  Heading,
  Text,
  HStack,
  Stack,
  Circle,
  Code,
  Link,
  VStack,
  Spacer,
} from '@chakra-ui/layout';
import { Skeleton } from '@chakra-ui/skeleton';
import { Select } from '@chakra-ui/select';
import { Alert, AlertIcon, AlertTitle } from '@chakra-ui/alert';
import {
  FormControl,
  FormLabel,
  FormHelperText,
} from '@chakra-ui/form-control';
import { Checkbox } from '@chakra-ui/checkbox';
import { Table, Tr, Td } from '@chakra-ui/table';
import { Tag, Tag as TagElement, TagLabel, TagLeftIcon } from '@chakra-ui/tag';
import { useToast } from '@chakra-ui/toast';
import {
  DocumentSnapshot,
  QueryDocumentSnapshot,
  Timestamp,
} from '@firebase/firestore';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { IoAdd, IoKeyOutline, IoKeySharp, IoPerson } from 'react-icons/io5';
import { GroupContext } from '../contexts/group';
import { AuthContext } from '../contexts/user';
import { Link as routerLink } from 'react-router-dom';
import {
  Account,
  addAccount,
  addAdmin,
  getAdmin,
  getGroup,
  Group,
  listAccount,
  setGroup,
} from '../utils/group';
import { createInvite } from '../utils/invite';
import { getMember, listMembers, Member } from '../utils/member';
import { createTag, listTag, tag, tagColors } from './../utils/group-tag';
import { CopyButton, FormButtons, GroupTag } from './assets';
import { useUniversalColors } from '../hooks/color-mode';
import { BasicButton, CancelButton } from './buttons';

const OrganizationName = () => {
  const { currentGroup } = useContext(GroupContext);
  useMemo(() => {
    if (currentGroup)
      getGroup(currentGroup.id).then((e) => {
        if (e) setCurrentGroupData(e);
        setOrganizationName(e?.data()?.name);
      });
  }, [currentGroup]);
  const [editMode, setEditMode] = useState(false);
  const [currentGroupData, setCurrentGroupData] =
    useState<DocumentSnapshot<Group>>();
  const [organizationName, setOrganizationName] = useState<string>();
  const toast = useToast();
  return (
    <HStack spacing="5">
      <Text wordBreak="keep-all">組織名</Text>
      <Skeleton isLoaded={!!organizationName}>
        <Input
          value={organizationName}
          isReadOnly={!editMode}
          onChange={(e) => setOrganizationName(e.target.value)}
        />
      </Skeleton>
      <FormButtons
        isDisable={!organizationName}
        onCancel={() => {
          setEditMode(false);
          setOrganizationName(currentGroupData?.data()?.name);
        }}
        editMode={editMode}
        onSave={() => {
          const _group = currentGroupData?.data();

          if (_group && organizationName && currentGroup) {
            _group.name = organizationName;
            setGroup(_group, currentGroup.id).catch(() => {
              setOrganizationName(currentGroupData?.data()?.name);
              toast({
                status: 'error',
                title: '保存に失敗しました',
              });
            });
          }
          setEditMode(false);
        }}
        setEditable={() => setEditMode(true)}
        saveAvailable={
          organizationName != currentGroupData?.data()?.name &&
          !!organizationName
        }
      />
    </HStack>
  );
};

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

const TagSetting = () => {
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

const TagList = () => {
  const { currentGroup } = useContext(GroupContext);
  const [tags, setTags] = useState<QueryDocumentSnapshot<tag>[]>([]);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  // ToDo: 無限スクロールを実装
  useEffect(() => {
    if (currentGroup)
      listTag(currentGroup.id).then((e) => {
        const tags: QueryDocumentSnapshot<tag>[] = [];
        e.forEach((j) => tags.push(j));

        setTags(tags);
        setIsLoaded(true);
      });
  }, [currentGroup, setIsLoaded]);
  return (
    <Skeleton isLoaded={isLoaded}>
      {tags.length > 0 ? (
        <Stack shouldWrapChildren direction="row">
          {tags?.map((e) => (
            <GroupTag tag={e} key={e.id} size="lg" />
          ))}
        </Stack>
      ) : (
        <Alert status="info">
          <AlertIcon />
          <AlertTitle>タグがありません</AlertTitle>
        </Alert>
      )}
    </Skeleton>
  );
};

const CreateInvite = ({
  email,
  isAdmin,
  memberId,
}: {
  email: string;
  isAdmin: boolean;
  memberId: string;
}) => {
  const [code] = useState(Math.random().toString(32).substring(2).slice(0, 6));
  const { account } = useContext(AuthContext);
  const { currentGroup } = useContext(GroupContext);

  useEffect(() => {
    if (account?.email && currentGroup && currentGroup)
      createInvite(email, {
        group: [currentGroup.ref],
        authorId: account.uid,
        used: false,
      }).then(() => {
        addAccount(
          email,
          new Account(memberId, false, Timestamp.now()),
          currentGroup.id
        );
        if (isAdmin) addAdmin(email, memberId, currentGroup.id);
      });
  }, [
    account?.email,
    account?.uid,
    code,
    currentGroup,
    email,
    isAdmin,
    memberId,
  ]);
  return <Text>作成しました</Text>;
};

const InviteElement = () => {
  const [createState, setCreateState] = useBoolean(false);
  const [email, setEmail] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [member, setMember] = useState('');
  const [members, setMembers] = useState<QueryDocumentSnapshot<Member>[]>();

  const { currentGroup } = useContext(GroupContext);
  useEffect(() => {
    if (currentGroup)
      listMembers(currentGroup.id).then((e) => {
        const _members: QueryDocumentSnapshot<Member>[] = [];
        e?.forEach((f) => _members.push(f));
        setMembers(_members);
      });
  }, [currentGroup]);
  return (
    <Box>
      <Heading size="lg" mb="5">
        招待
      </Heading>
      {createState ? (
        <CreateInvite email={email} isAdmin={isAdmin} memberId={member} />
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (email.length) setCreateState.on();
          }}
        >
          <Box>
            <FormControl isRequired>
              <FormLabel>メールアドレス</FormLabel>
              <Input
                value={email}
                type="email"
                onChange={(e) => setEmail(e.target.value)}
              />
              <FormHelperText>
                招待する人のメールアドレスを入力してください
              </FormHelperText>
            </FormControl>
            <FormControl isRequired>
              <FormLabel>関連付けるメンバー</FormLabel>
              {members && (
                <Select
                  onChange={(e) => {
                    setMember(members[e.target.selectedIndex].id);
                  }}
                >
                  {members.map((_member) => (
                    <option id={_member.id} key={_member.id}>
                      {_member.data().name}
                    </option>
                  ))}
                </Select>
              )}
              <FormHelperText>招待するメンバーを選んでください</FormHelperText>
            </FormControl>
            <Checkbox
              checked={isAdmin}
              onChange={(e) => setIsAdmin(e.target.checked)}
            >
              管理者として招待
            </Checkbox>
          </Box>
          <BasicButton variant="secondary" type="submit" mt="2" size="sm">
            招待
          </BasicButton>
        </form>
      )}
    </Box>
  );
};

const AccountList = () => {
  const [accounts, setAccounts] = useState<QueryDocumentSnapshot<Account>[]>(
    []
  );
  const { currentGroup } = useContext(GroupContext);
  useEffect(() => {
    if (currentGroup)
      listAccount(currentGroup.id).then((_accounts) => {
        const __accounts: QueryDocumentSnapshot<Account>[] = [];
        _accounts.forEach((account) => __accounts.push(account));
        setAccounts(__accounts);
      });
  }, [currentGroup]);
  return (
    <Box>
      <Heading size="lg" pb="2">
        連携済みアカウント
      </Heading>
      <Table alignItems="flex-start">
        {accounts.map((account) => (
          <AccountItem account={account} key={account.id} />
        ))}
      </Table>
    </Box>
  );
};

const AccountItem = ({
  account,
}: {
  account: QueryDocumentSnapshot<Account>;
}) => {
  const [member, setMember] = useState<DocumentSnapshot<Member> | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const { currentGroup } = useContext(GroupContext);
  useEffect(() => {
    if (currentGroup) {
      getMember(account.data().memberId, currentGroup.id).then(setMember);
      try {
        getAdmin(account.data().memberId, currentGroup.id).then((e) => {
          if (e.data()) {
            setIsAdmin(true);
          }
        });
      } catch {
        setIsAdmin(false);
      }
    }
  }, [account, currentGroup]);
  return (
    <Tr>
      <Td>
        <HStack spacing="1">
          <Link as={routerLink} to={`/member/${member?.id}`}>
            {member?.data()?.name}
          </Link>
        </HStack>
      </Td>
      <Td>
        <Tag colorScheme={isAdmin ? 'green' : 'gray'}>
          <TagLeftIcon as={isAdmin ? IoKeySharp : IoPerson} />
          <TagLabel>{isAdmin ? '管理者' : '通常'}</TagLabel>
        </Tag>
      </Td>
      <Td>
        <HStack>
          <Code>{account.id.replace(/.+@/g, '******@')}</Code>
          <CopyButton copyTarget={account.id} size="xs"></CopyButton>
        </HStack>
      </Td>
      <Td>
        <HStack alignItems="center">
          <Circle
            bgColor={account.data().isActive ? 'green.400' : 'gray.400'}
            size="3"
          />
          <Text>{account.data().isActive ? 'アクティブ' : '承諾待ち'}</Text>
        </HStack>
      </Td>
    </Tr>
  );
};

const AdminSetting: React.FC = () => {
  return (
    <Box>
      <Stack py="4" spacing="8">
        <HStack spacing="4">
          <Heading size="lg">組織設定</Heading>
          <TagElement>
            <TagLeftIcon as={IoKeyOutline} />
            <TagLabel>管理者のみが設定できます</TagLabel>
          </TagElement>
        </HStack>
        <OrganizationName />
        <TagSetting />
        <InviteElement />
        <AccountList />
      </Stack>
    </Box>
  );
};

export default AdminSetting;
