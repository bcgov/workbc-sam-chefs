/* eslint-disable no-prototype-builtins */
/* eslint-disable no-param-reassign */
import * as express from "express"
import moment from "moment"
import * as samService from "../services/sam.service"

const orgs = JSON.parse(`{}`) //TODO: load from env

export const getAll = async (req: express.Request, res: express.Response) => {
    try {
        const users = await samService.getAll(false)
        const usersWithPermissions = users.filter((item: any) => item.Properties.length > 0)
        const usersWithAccessNotEnded = usersWithPermissions.filter(
            (item: any) => item.EndDate === null || !(moment(item.EndDate).utc().diff(moment().utc()) < 0)
        )
        const filteredUsers = usersWithAccessNotEnded.filter((item: any) => orgs.hasOwnProperty(item.Organization))
        const sysUsers = { sys_users: {} }
        filteredUsers.forEach((u: any) => {
            const accessEnded = moment(u.EndDate).utc().diff(moment().utc()) < 0
            const hasAccess = u.Properties.some(
                (props: any) =>
                    props.SecurityRole.ApplicationCode === "WSG" &&
                    (moment(props.EndDate).isValid() ? moment(props.EndDate).utc().diff(moment().utc()) < 0 : true)
            )
            u.Organization = orgs[u.Organization]
            u.SNOWAccess = !accessEnded && hasAccess
            delete u.StartDate
            delete u.EndDate
            delete u.Properties
            delete u.RowVersion
            delete u.GUID
            delete u.TypeDescription
        })
        sysUsers.sys_users = filteredUsers
        return res.status(200).send(sysUsers)
    } catch (error: any) {
        console.log(error)
        return res.status(500).send("Internal Server Error")
    }
}
