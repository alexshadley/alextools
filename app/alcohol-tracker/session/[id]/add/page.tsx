import { AddDrinkView } from '../../../components/add-drink-view';

export default async function AddDrinkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AddDrinkView id={id} />;
}
