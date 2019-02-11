
import {
    PictureRepositoryBuilder,
    TopicRepositoryBuilder,
    UniqueNameRepositoryBuilder,
    UnknownNameRepositoryBuilder,
} from '@entipic/data';

import { connect, MongoClient } from 'mongodb';
import { PictureRepository, TopicRepository, UnknownNameRepository, UniqueNameRepository } from '@entipic/domain';

if (!process.env.ENTIPIC_CONNECTION) {
    throw `ENTIPIC_CONNECTION is required`;
}

export let topicRepository: TopicRepository;
export let uniqueNameRepository: UniqueNameRepository;
export let unknownNameRepository: UnknownNameRepository;
export let pictureRepository: PictureRepository;

let connection: MongoClient

export async function initData() {
    if (connection) {
        return;
    }
    connection = await connect(process.env.ENTIPIC_CONNECTION || '');
    const db = connection.db();
    pictureRepository = PictureRepositoryBuilder.build(db);
    uniqueNameRepository = UniqueNameRepositoryBuilder.build(db);
    unknownNameRepository = UnknownNameRepositoryBuilder.build(db);
    topicRepository = TopicRepositoryBuilder.build(db);

    await pictureRepository.createStorage();
    await uniqueNameRepository.createStorage();
    await unknownNameRepository.createStorage();
    await topicRepository.createStorage();
}

export async function closeData() {
    if (connection) {
        await connection.close()
    }
}
