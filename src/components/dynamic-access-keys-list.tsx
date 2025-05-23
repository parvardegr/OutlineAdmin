"use client";

import {
    Alert,
    Button,
    Chip,
    Input,
    Pagination,
    Spinner,
    Table,
    TableBody,
    TableCell,
    TableColumn,
    TableHeader,
    TableRow,
    Tooltip,
    useDisclosure
} from "@heroui/react";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { DynamicAccessKey } from "@prisma/client";
import { Link } from "@heroui/link";

import ConfirmModal from "@/src/components/modals/confirm-modal";
import { DeleteIcon, EditIcon, EyeIcon, InfoIcon, KeyIcon, PlusIcon } from "@/src/components/icons";
import NoResult from "@/src/components/no-result";
import { DynamicAccessKeyWithAccessKeysCount } from "@/src/core/definitions";
import {
    getDynamicAccessKeys,
    getDynamicAccessKeysCount,
    removeDynamicAccessKey
} from "@/src/core/actions/dynamic-access-key";
import AccessKeyValidityChip from "@/src/components/access-key-validity-chip";
import DynamicAccessKeyModal from "@/src/components/modals/dynamic-access-key-modal";
import DynamicAccessKeyFormModal from "@/src/components/modals/dynamic-access-key-form-modal";
import { app, PAGE_SIZE } from "@/src/core/config";

interface SearchFormProps {
    term: string;
}

export default function DynamicAccessKeysList() {
    const [dynamicAccessKeys, setDynamicAccessKeys] = useState<DynamicAccessKeyWithAccessKeysCount[]>([]);
    const [currentDynamicAccessKey, setCurrentDynamicAccessKey] = useState<DynamicAccessKey>();
    const [page, setPage] = useState<number>(1);
    const [totalItems, setTotalItems] = useState<number>(1);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const totalPage = Math.ceil(totalItems / PAGE_SIZE);

    const dynamicAccessKeyFormModalDisclosure = useDisclosure();
    const removeDynamicAccessKeyConfirmModalDisclosure = useDisclosure();
    const dynamicAccessKeyModalDisclosure = useDisclosure();

    const searchForm = useForm<SearchFormProps>();
    const handleSearch = async (data: SearchFormProps) => {
        const params = {
            term: data.term
        };

        const filteredServers = await getDynamicAccessKeys(params, true);
        const total = await getDynamicAccessKeysCount(params);

        setTotalItems(total);
        setDynamicAccessKeys(filteredServers);
        setPage(1);
    };

    const handleRemoveDynamicAccessKey = async () => {
        if (!currentDynamicAccessKey) return;

        await removeDynamicAccessKey(currentDynamicAccessKey.id);
        await updateData();
    };

    const getCurrentAccessKeyUrl = () => {
        if (!currentDynamicAccessKey) return;

        const swappedProtocol = window.location.origin.replace("http://", "ssconf://").replace("https://", "ssconf://");
        const name = encodeURIComponent(currentDynamicAccessKey.name);

        return `${swappedProtocol}/api/dak/${currentDynamicAccessKey.path}#${name}`;
    };

    const updateData = async () => {
        const params = { skip: (page - 1) * PAGE_SIZE, term: searchForm.getValues("term") };

        setIsLoading(true);

        try {
            const data = await getDynamicAccessKeys(params, true);

            setDynamicAccessKeys(data);

            const count = await getDynamicAccessKeysCount(params);

            setTotalItems(count);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        updateData();
    }, [page]);

    return (
        <>
            <DynamicAccessKeyModal disclosure={dynamicAccessKeyModalDisclosure} value={getCurrentAccessKeyUrl()} />

            <DynamicAccessKeyFormModal
                disclosure={dynamicAccessKeyFormModalDisclosure}
                dynamicAccessKeyData={currentDynamicAccessKey}
                onSuccess={updateData}
            />

            <ConfirmModal
                body={
                    <div className="grid gap-2">
                        <span>Are you sure you want to remove this dynamic access key?</span>
                        <p className="text-default-500 text-sm whitespace-pre-wrap break-all">
                            {getCurrentAccessKeyUrl()}
                        </p>
                    </div>
                }
                confirmLabel="Remove"
                disclosure={removeDynamicAccessKeyConfirmModalDisclosure}
                title="Remove Dyanmic Access Key"
                onConfirm={handleRemoveDynamicAccessKey}
            />

            <div className="grid gap-4">
                <div className="flex gap-2 items-center">
                    <h1 className="text-xl">Your Dynamic Access Keys</h1>

                    <Tooltip content="Read more about dynamic access keys">
                        <Link href={app.links.outlineVpnWiki.dynamicAccessKeys} target="_blank">
                            <InfoIcon size={20} />
                        </Link>
                    </Tooltip>
                </div>

                <Alert color="warning">A valid domain name with SSL encryption is required to use this feature.</Alert>

                <div className="flex justify-between items-center gap-2">
                    <form onSubmit={searchForm.handleSubmit(handleSearch)}>
                        <Input
                            className="w-fit"
                            placeholder="Name [+Enter]"
                            startContent={<>🔍</>}
                            variant="faded"
                            {...searchForm.register("term")}
                        />
                    </form>

                    <Button
                        color="primary"
                        startContent={<PlusIcon size={20} />}
                        variant="shadow"
                        onPress={() => {
                            setCurrentDynamicAccessKey(undefined);
                            dynamicAccessKeyFormModalDisclosure.onOpen();
                        }}
                    >
                        Create
                    </Button>
                </div>

                <Table
                    aria-label="Dynamic access keys list"
                    bottomContent={
                        totalPage > 1 && (
                            <div className="flex justify-center">
                                <Pagination initialPage={page} total={totalPage} variant="light" onChange={setPage} />
                            </div>
                        )
                    }
                    color="primary"
                    isCompact={false}
                    isHeaderSticky={true}
                    isStriped={true}
                    shadow="sm"
                >
                    <TableHeader>
                        <TableColumn>ID</TableColumn>
                        <TableColumn>NAME</TableColumn>
                        <TableColumn>PATH</TableColumn>
                        <TableColumn>PREFIX</TableColumn>
                        <TableColumn align="center">NUMBER OF KEYS</TableColumn>
                        <TableColumn align="center">LOAD BALANCER ALGO</TableColumn>
                        <TableColumn align="center">VALIDITY</TableColumn>
                        <TableColumn align="center">ACTIONS</TableColumn>
                    </TableHeader>
                    <TableBody emptyContent={<NoResult />} isLoading={isLoading} loadingContent={<Spinner />}>
                        {dynamicAccessKeys.map((dynamicAccessKey) => (
                            <TableRow key={dynamicAccessKey.id}>
                                <TableCell>{dynamicAccessKey.id}</TableCell>
                                <TableCell>
                                    <span className="whitespace-nowrap">{dynamicAccessKey.name}</span>
                                </TableCell>
                                <TableCell>{dynamicAccessKey.path}</TableCell>
                                <TableCell>
                                    <Chip
                                        color={dynamicAccessKey.prefix ? "success" : "default"}
                                        size="sm"
                                        variant="flat"
                                    >
                                        {dynamicAccessKey.prefix ? dynamicAccessKey.prefix : "None"}
                                    </Chip>
                                </TableCell>
                                <TableCell>
                                    <Chip color="default" size="sm" variant="flat">
                                        {dynamicAccessKey._count?.accessKeys}
                                    </Chip>
                                </TableCell>
                                <TableCell>
                                    <Chip color="default" size="sm" variant="flat">
                                        {dynamicAccessKey.loadBalancerAlgorithm}
                                    </Chip>
                                </TableCell>
                                <TableCell width={160}>
                                    <AccessKeyValidityChip value={dynamicAccessKey.expiresAt} />
                                </TableCell>
                                <TableCell>
                                    <div className="flex gap-2 justify-center items-center">
                                        <Tooltip
                                            closeDelay={100}
                                            color="primary"
                                            content="Show the key"
                                            delay={600}
                                            size="sm"
                                        >
                                            <Button
                                                color="primary"
                                                isIconOnly={true}
                                                size="sm"
                                                variant="light"
                                                onPress={() => {
                                                    setCurrentDynamicAccessKey(dynamicAccessKey);
                                                    dynamicAccessKeyModalDisclosure.onOpen();
                                                }}
                                            >
                                                <EyeIcon size={24} />
                                            </Button>
                                        </Tooltip>

                                        <Tooltip
                                            closeDelay={100}
                                            color="primary"
                                            content="Manage access keys"
                                            delay={600}
                                            size="sm"
                                        >
                                            <Button
                                                as={Link}
                                                color="primary"
                                                href={`/dynamic-access-keys/${dynamicAccessKey.id}/access-keys`}
                                                isIconOnly={true}
                                                size="sm"
                                                variant="light"
                                            >
                                                <KeyIcon size={24} />
                                            </Button>
                                        </Tooltip>

                                        <Tooltip
                                            closeDelay={100}
                                            color="primary"
                                            content="Edit the key"
                                            delay={600}
                                            size="sm"
                                        >
                                            <Button
                                                color="primary"
                                                isIconOnly={true}
                                                size="sm"
                                                variant="light"
                                                onPress={() => {
                                                    setCurrentDynamicAccessKey(dynamicAccessKey);
                                                    dynamicAccessKeyFormModalDisclosure.onOpen();
                                                }}
                                            >
                                                <EditIcon size={24} />
                                            </Button>
                                        </Tooltip>

                                        <Tooltip
                                            closeDelay={100}
                                            color="danger"
                                            content="Remove the key"
                                            delay={600}
                                            size="sm"
                                        >
                                            <Button
                                                color="danger"
                                                isIconOnly={true}
                                                size="sm"
                                                variant="light"
                                                onPress={() => {
                                                    setCurrentDynamicAccessKey(dynamicAccessKey);
                                                    removeDynamicAccessKeyConfirmModalDisclosure.onOpen();
                                                }}
                                            >
                                                <DeleteIcon size={24} />
                                            </Button>
                                        </Tooltip>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </>
    );
}
