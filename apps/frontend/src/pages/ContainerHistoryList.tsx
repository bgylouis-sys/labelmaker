import { useEffect, useState, useCallback } from 'react';
import { Table, Button, Space, Typography, Pagination, Modal, DatePicker, message } from 'antd';
import { EyeOutlined, PrinterOutlined, SearchOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import Input from 'antd/es/input/Input';
import api from '../api/client';
import PrintPreview from '../components/PrintPreview';
import ItemDetails from '../components/ItemDetails';
import type { Item } from '../store/itemStore';

export default function ContainerHistoryList() {
  const { t } = useTranslation();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [printItem, setPrintItem] = useState<Item | null>(null);
  const [detailItem, setDetailItem] = useState<Item | null>(null);
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);

  const fetchContainers = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '20' };
      if (search) params.search = search;
      const res = await api.get('/containers', { params });
      setItems(res.data.items);
      setTotal(res.data.total);
    } catch {
      message.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [page, search, t]);

  useEffect(() => {
    fetchContainers();
  }, [fetchContainers]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const filtered = dateRange
    ? items.filter((item) => {
        const d = new Date(item.createdAt).getTime();
        const start = new Date(dateRange[0]).getTime();
        const end = new Date(dateRange[1]).getTime() + 86400000;
        return d >= start && d <= end;
      })
    : items;

  const columns = [
    { title: t('item.uniqueCode'), dataIndex: 'uniqueCode', key: 'code', width: 160 },
    { title: t('container.containerName'), dataIndex: 'nameCn', key: 'nameCn' },
    { title: t('container.containerNameEn'), dataIndex: 'nameEn', key: 'nameEn' },
    {
      title: t('container.itemCount'),
      key: 'itemCount',
      width: 100,
      render: (_: unknown, record: Item) => record.containerItems?.length ?? 0,
    },
    {
      title: t('item.createdAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (d: string) => new Date(d).toLocaleDateString(),
    },
    {
      title: t('item.actions'),
      key: 'actions',
      width: 140,
      render: (_: unknown, record: Item) => (
        <Space>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => setDetailItem(record)}
          />
          <Button
            size="small"
            icon={<PrinterOutlined />}
            onClick={() => setPrintItem(record)}
          >
            {t('container.printPackingList')}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          {t('nav.containerHistory')}
        </Typography.Title>
      </div>

      <div style={{ marginBottom: 16, display: 'flex', gap: 12 }}>
        <Input
          prefix={<SearchOutlined />}
          placeholder={t('item.search')}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
          }}
          style={{ width: 300 }}
          allowClear
        />
        <DatePicker.RangePicker
          onChange={(dates) => {
            if (dates && dates[0] && dates[1]) {
              setDateRange([dates[0].format('YYYY-MM-DD'), dates[1].format('YYYY-MM-DD')]);
            } else {
              setDateRange(null);
            }
          }}
          placeholder={['Start Date', 'End Date']}
        />
      </div>

      <Table
        dataSource={filtered}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={false}
        scroll={{ x: 800 }}
      />

      {total > 20 && (
        <div style={{ marginTop: 16, textAlign: 'right' }}>
          <Pagination
            current={page}
            total={total}
            pageSize={20}
            onChange={handlePageChange}
            showTotal={(t) => `Total ${t}`}
          />
        </div>
      )}

      <Modal
        title={t('common.detail')}
        open={!!detailItem}
        onCancel={() => setDetailItem(null)}
        footer={null}
        width={700}
      >
        {detailItem && <ItemDetails item={detailItem} />}
      </Modal>

      {printItem && (
        <PrintPreview
          items={[printItem]}
          open={!!printItem}
          onClose={() => setPrintItem(null)}
          mode="packing"
        />
      )}
    </div>
  );
}
