/* eslint-disable no-prototype-builtins */
/* eslint-disable no-param-reassign */
import moment from "moment"
import * as samService from "../services/sam.service"

export const getAll = async () => {
    try {
        const users = await samService.getAll()
        const filteredUsers = users.filter((user: any) => {
            return user.Properties.length > 0
                && (user.EndDate === null || !(moment(user.EndDate).utc().diff(moment().utc()) < 0))
                && (user.Properties.some(
                    (props: any) =>
                        props.SecurityRole.ApplicationCode === "WGS" && // WGS <=> Wage Subsidy
                        (moment(props.EndDate).isValid() ? moment(props.EndDate).utc().diff(moment().utc()) < 0 : true)
                ))
        })
        return filteredUsers.map((user: any) => { return { guid: user.UserIDGUID, idp: user.TypeCode, username: user.UserID } })
    } catch (error: any) {
        console.log(error)
    }
}
