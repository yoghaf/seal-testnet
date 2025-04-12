// Copyright (c), Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { useCallback, useEffect, useState } from 'react';
import { useNetworkVariable } from './networkConfig';
import { Button, Card } from '@radix-ui/themes';
import { getObjectExplorerLink } from './utils';

export interface Cap {
  id: string;
  allowlist_id: string;
}

export interface CardItem {
  cap_id: string;
  allowlist_id: string;
  list: string[];
  name: string;
}

export function AllAllowlist() {
  const packageId = useNetworkVariable('packageId');
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();

  const [cardItems, setCardItems] = useState<CardItem[]>([]);

  const getCapObj = useCallback(async () => {
    if (!currentAccount?.address) return;

    const res = await suiClient.getOwnedObjects({
      owner: currentAccount?.address,
      options: {
        showContent: true,
        showType: true,
      },
      filter: {
        StructType: `${packageId}::allowlist::Cap`,
      },
    });
    const caps = res.data
      .map((obj) => {
        const fields = (obj!.data!.content as { fields: any }).fields;
        return {
          id: fields?.id.id,
          allowlist_id: fields?.allowlist_id,
        };
      })
      .filter((item) => item !== null) as Cap[];
    const cardItems: CardItem[] = await Promise.all(
      caps.map(async (cap) => {
        const allowlist = await suiClient.getObject({
          id: cap.allowlist_id,
          options: { showContent: true },
        });
        const fields = (allowlist.data?.content as { fields: any })?.fields || {};
        return {
          cap_id: cap.id,
          allowlist_id: cap.allowlist_id,
          list: fields.list,
          name: fields.name,
        };
      }),
    );
    setCardItems(cardItems);
  }, [currentAccount?.address]);

  useEffect(() => {
    getCapObj();
  }, [getCapObj]);

  return (
    <Card>
      <h2 style={{ marginBottom: '1rem' }}>Admin View: Owned Allowlists</h2>
      <p style={{ marginBottom: '2rem' }}>
        These are all the allowlists that you have created. Click manage to edit the allowlist and
        upload new files to the allowlist.
      </p>
      {cardItems.map((item) => (
        <Card key={`${item.cap_id} - ${item.allowlist_id}`}>
          <p>
            {item.name} (ID {getObjectExplorerLink(item.allowlist_id)})
          </p>
          <Button
            onClick={() => {
              window.open(
                `${window.location.origin}/allowlist-example/admin/allowlist/${item.allowlist_id}`,
                '_blank',
              );
            }}
          >
            Manage
          </Button>
        </Card>
      ))}
    </Card>
  );
}
